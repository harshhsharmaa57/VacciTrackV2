import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Otp from '../models/Otp.js';
import Child from '../models/Child.js';
import User from '../models/User.js';
import { generateOtp, sendOtp, maskPhone } from '../utils/smsService.js';

const router = express.Router();

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// Rate limiter specifically for OTP SMS endpoints to prevent SMS bombing
const otpSmsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 OTP sends per IP per 15 min
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again after some time.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP verification to prevent brute-force
const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // max 15 verify attempts per IP per 5 min
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Resolve the parent phone number for a child.
 * Priority: child.parentPhone → parent user's phone
 */
const resolveParentPhone = async (child) => {
  if (child.parentPhone) {
    return child.parentPhone;
  }

  // Fallback to the parent user's phone
  const parentId =
    typeof child.parentId === 'object' ? child.parentId._id : child.parentId;
  const parentUser = await User.findById(parentId).select('phone');
  return parentUser?.phone || null;
};

// ──────────────────────────────────────────────
// POST /api/otp/send — Generate and send OTP
// ──────────────────────────────────────────────
router.post(
  '/send',
  otpSmsLimiter,
  protect,
  authorize('doctor'),
  [
    body('childId').notEmpty().withMessage('Child ID is required'),
    body('vaccineId').notEmpty().withMessage('Vaccine ID is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { childId, vaccineId } = req.body;

    // 1. Find the child
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }

    // 2. Check the vaccine exists in schedule and isn't already completed
    const vaccine = child.schedule.find((v) => v.vaccineId === vaccineId);
    if (!vaccine) {
      return res.status(404).json({
        success: false,
        error: 'Vaccine not found in schedule',
      });
    }
    if (vaccine.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'This vaccine has already been administered',
      });
    }

    // 3. Resolve parent phone
    const phone = await resolveParentPhone(child);
    if (!phone) {
      return res.status(400).json({
        success: false,
        error:
          'Parent phone number is missing. Please add the parent phone number before administering the vaccine.',
        missingPhone: true,
      });
    }

    // 4. Invalidate any existing unused OTPs for this child+vaccine
    await Otp.updateMany(
      { childId, vaccineId, used: false },
      { $set: { used: true } }
    );

    // 5. Generate and hash OTP
    const otp = generateOtp();
    const otpHash = await Otp.hashOtp(otp);

    // 6. Store OTP record
    const otpRecord = await Otp.create({
      childId,
      vaccineId,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      doctorId: req.user._id,
      phone,
    });

    // 7. Send OTP via SMS
    const smsResult = await sendOtp(phone, otp);

    if (!smsResult.success) {
      // Mark the OTP as used so it can't be verified
      otpRecord.used = true;
      await otpRecord.save();

      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP. Please try again.',
        smsError: true,
      });
    }

    console.log(
      `[OTP] Sent for child=${childId} vaccine=${vaccineId} by doctor=${req.user._id}`
    );

    res.json({
      success: true,
      message: 'OTP sent successfully',
      phoneLastFour: maskPhone(phone),
      expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
      // Include OTP in response when using console provider (no real SMS)
      ...((process.env.SMS_PROVIDER || 'console') === 'console' && { devOtp: otp }),
    });
  })
);

// ──────────────────────────────────────────────
// POST /api/otp/verify — Verify OTP and administer vaccine
// ──────────────────────────────────────────────
router.post(
  '/verify',
  otpVerifyLimiter,
  protect,
  authorize('doctor'),
  [
    body('childId').notEmpty().withMessage('Child ID is required'),
    body('vaccineId').notEmpty().withMessage('Vaccine ID is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP must be a 6-digit number'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { childId, vaccineId, otp } = req.body;

    // 1. Find active OTP (not used, not expired)
    const otpRecord = await Otp.findOne({
      childId,
      vaccineId,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      console.log(
        `[OTP] Verify failed — no active OTP for child=${childId} vaccine=${vaccineId}`
      );
      return res.status(400).json({
        success: false,
        error: 'OTP has expired or is invalid. Please request a new one.',
        expired: true,
      });
    }

    // 2. Check attempt limit
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      console.log(
        `[OTP] Verify blocked — max attempts reached for child=${childId} vaccine=${vaccineId}`
      );
      otpRecord.used = true;
      await otpRecord.save();
      return res.status(429).json({
        success: false,
        error:
          'Too many incorrect attempts. This OTP has been invalidated. Please request a new one.',
        maxAttempts: true,
      });
    }

    // 3. Increment attempt count
    otpRecord.attempts += 1;
    await otpRecord.save();

    // 4. Compare OTP
    const isValid = await Otp.compareOtp(otp, otpRecord.otpHash);

    if (!isValid) {
      const remaining = MAX_ATTEMPTS - otpRecord.attempts;
      console.log(
        `[OTP] Verify failed — wrong OTP for child=${childId} vaccine=${vaccineId} (${remaining} attempts left)`
      );
      return res.status(400).json({
        success: false,
        error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
        attemptsRemaining: remaining,
      });
    }

    // 5. OTP is valid — mark as used + update vaccine status atomically
    otpRecord.used = true;
    await otpRecord.save();

    // Update the vaccine in the child's schedule
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }

    const vaccine = child.schedule.find((v) => v.vaccineId === vaccineId);
    if (!vaccine) {
      return res.status(404).json({
        success: false,
        error: 'Vaccine not found in schedule',
      });
    }

    vaccine.status = 'COMPLETED';
    vaccine.administeredDate = new Date();

    // Recalculate statuses for remaining vaccines
    child.schedule.forEach((v) => {
      if (v.vaccineId !== vaccineId && !v.administeredDate) {
        const today = new Date();
        const daysDiff = Math.floor(
          (v.dueDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff > 7) {
          v.status = 'UPCOMING';
        } else if (daysDiff >= -28) {
          v.status = 'PENDING';
        } else {
          v.status = 'OVERDUE';
        }
      }
    });

    await child.save();

    const updatedChild = await Child.findById(childId).populate(
      'parentId',
      'name email phone'
    );

    console.log(
      `[OTP] ✅ Verified — vaccine=${vaccineId} administered for child=${childId} by doctor=${req.user._id}`
    );

    res.json({
      success: true,
      message: 'OTP verified. Vaccine administered successfully.',
      data: updatedChild,
    });
  })
);

// ──────────────────────────────────────────────
// POST /api/otp/resend — Resend OTP with cooldown
// ──────────────────────────────────────────────
router.post(
  '/resend',
  otpSmsLimiter,
  protect,
  authorize('doctor'),
  [
    body('childId').notEmpty().withMessage('Child ID is required'),
    body('vaccineId').notEmpty().withMessage('Vaccine ID is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { childId, vaccineId } = req.body;

    // 1. Check cooldown — find the most recent OTP for this child+vaccine
    const lastOtp = await Otp.findOne({
      childId,
      vaccineId,
    }).sort({ createdAt: -1 });

    if (lastOtp) {
      const elapsed = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
        return res.status(429).json({
          success: false,
          error: `Please wait ${waitTime} seconds before requesting a new OTP.`,
          cooldown: true,
          waitTime,
        });
      }
    }

    // 2. Find the child and resolve phone
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }

    const phone = await resolveParentPhone(child);
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Parent phone number is missing.',
        missingPhone: true,
      });
    }

    // 3. Invalidate all existing OTPs
    await Otp.updateMany(
      { childId, vaccineId, used: false },
      { $set: { used: true } }
    );

    // 4. Generate new OTP
    const otp = generateOtp();
    const otpHash = await Otp.hashOtp(otp);

    await Otp.create({
      childId,
      vaccineId,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      doctorId: req.user._id,
      phone,
    });

    // 5. Send via SMS
    const smsResult = await sendOtp(phone, otp);

    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to resend OTP. Please try again.',
        smsError: true,
      });
    }

    console.log(
      `[OTP] Resent for child=${childId} vaccine=${vaccineId} by doctor=${req.user._id}`
    );

    res.json({
      success: true,
      message: 'New OTP sent successfully',
      phoneLastFour: maskPhone(phone),
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      ...((process.env.SMS_PROVIDER || 'console') === 'console' && { devOtp: otp }),
    });
  })
);

export default router;
