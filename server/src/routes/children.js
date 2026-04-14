import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Child from '../models/Child.js';
import User from '../models/User.js';
import { generateAbhaId } from '../utils/generateAbhaId.js';
import { generateVaccineSchedule } from '../utils/vaccineSchedule.js';
import { normalizePhone } from '../utils/smsService.js';

const router = express.Router();

router.get('/', protect, asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'parent') {
    query.parentId = req.user._id;
  } else if (req.user.role === 'doctor') {
    query.doctorId = req.user._id;
  }

  const children = await Child.find(query)
    .populate('parentId', 'name email phone')
    .populate('doctorId', 'name doctorId hospitalName specialization')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: children.length,
    data: children,
  });
}));

router.get('/search', protect, authorize('doctor'), asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required',
    });
  }

  const children = await Child.find({
    doctorId: req.user._id,
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { abhaId: q },
    ],
  }).populate('parentId', 'name email phone').populate('doctorId', 'name doctorId hospitalName specialization');

  res.json({
    success: true,
    count: children.length,
    data: children,
  });
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id)
    .populate('parentId', 'name email phone')
    .populate('doctorId', 'name doctorId hospitalName specialization');

  if (!child) {
    return res.status(404).json({
      success: false,
      error: 'Child not found',
    });
  }

  if (req.user.role === 'parent' && child.parentId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this child',
    });
  }
  if (
    req.user.role === 'doctor' &&
    (!child.doctorId || child.doctorId._id.toString() !== req.user._id.toString())
  ) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this child',
    });
  }

  res.json({
    success: true,
    data: child,
  });
}));

router.post(
  '/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Child name is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
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

    const { name, dateOfBirth, gender, parentId, parentPhone } = req.body;

    let finalParentId = req.user._id;
    if (req.user.role === 'doctor' && parentId) {
      finalParentId = parentId;
    }

    let abhaId = generateAbhaId();
    let abhaExists = await Child.findOne({ abhaId });
    while (abhaExists) {
      abhaId = generateAbhaId();
      abhaExists = await Child.findOne({ abhaId });
    }

    const dob = new Date(dateOfBirth);
    const schedule = generateVaccineSchedule(dob);

    // Normalize parentPhone to +91XXXXXXXXXX if provided
    const normalizedPhone = parentPhone ? normalizePhone(parentPhone) : undefined;

    let assignedDoctorId = null;
    if (req.user.role === 'doctor') {
      assignedDoctorId = req.user._id;
    } else {
      const sampleDoctorEmail = (process.env.SAMPLE_DOCTOR_EMAIL || 'doctor@aiims.com').toLowerCase();
      const sampleDoctor = await User.findOne({
        email: sampleDoctorEmail,
        role: 'doctor',
      }).select('_id');
      if (sampleDoctor) {
        assignedDoctorId = sampleDoctor._id;
      }
    }

    const child = await Child.create({
      parentId: finalParentId,
      name,
      dateOfBirth: dob,
      gender,
      abhaId,
      schedule,
      ...(normalizedPhone && { parentPhone: normalizedPhone }),
      ...(assignedDoctorId && { doctorId: assignedDoctorId }),
    });

    const populatedChild = await Child.findById(child._id)
      .populate('parentId', 'name email phone')
      .populate('doctorId', 'name doctorId hospitalName specialization');

    res.status(201).json({
      success: true,
      data: populatedChild,
    });
  })
);

router.patch(
  '/:id',
  protect,
  authorize('doctor'),
  [
    body('name').optional().trim().notEmpty().withMessage('Child name is required'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Valid date of birth is required'),
    body('gender')
      .optional()
      .isIn(['male', 'female'])
      .withMessage('Gender must be male or female'),
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

    const { id } = req.params;
    const { name, dateOfBirth, gender, parentPhone } = req.body;

    const child = await Child.findById(id);
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }
    if (!child.doctorId || child.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this child',
      });
    }

    if (name !== undefined) {
      child.name = name;
    }
    if (dateOfBirth !== undefined) {
      child.dateOfBirth = new Date(dateOfBirth);
    }
    if (gender !== undefined) {
      child.gender = gender;
    }
    if (parentPhone !== undefined) {
      const normalized = normalizePhone(parentPhone);
      if (normalized) {
        child.parentPhone = normalized;
      }
    }

    await child.save();

    const updatedChild = await Child.findById(id).populate('parentId', 'name email phone');

    res.json({
      success: true,
      data: updatedChild,
    });
  })
);

router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const child = await Child.findById(id).populate('parentId');
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }

    if (req.user.role === 'parent') {
      const parentId = typeof child.parentId === 'object' ? child.parentId._id.toString() : child.parentId.toString();
      if (parentId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this child',
        });
      }
    }

    const parentId = typeof child.parentId === 'object' ? child.parentId._id : child.parentId;

    await child.deleteOne();

    const remainingChildren = await Child.countDocuments({ parentId });

    if (remainingChildren === 0) {
      const parent = await User.findById(parentId);
      if (parent && parent.role === 'parent') {
        await parent.deleteOne();
        return res.json({
          success: true,
          message: 'Child deleted successfully. Parent account has been deleted as it had no remaining children.',
          parentDeleted: true,
        });
      }
    }

    res.json({
      success: true,
      message: 'Child deleted successfully',
      parentDeleted: false,
    });
  })
);

router.put(
  '/:id/vaccines/:vaccineId',
  protect,
  authorize('doctor'),
  [
    body('administeredDate').optional().isISO8601(),
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

    const { id, vaccineId } = req.params;
    const { administeredDate } = req.body;

    const child = await Child.findById(id);
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }
    if (!child.doctorId || child.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to administer vaccines for this child',
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
    vaccine.administeredDate = administeredDate ? new Date(administeredDate) : new Date();

    await child.save();

    const dob = child.dateOfBirth;
    child.schedule.forEach((v) => {
      if (v.vaccineId !== vaccineId && !v.administeredDate) {
        const today = new Date();
        const daysDiff = Math.floor((v.dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 7) {
          v.status = 'UPCOMING';
        } else if (daysDiff >= -28) { // Default grace period
          v.status = 'PENDING';
        } else {
          v.status = 'OVERDUE';
        }
      }
    });

    await child.save();

    const updatedChild = await Child.findById(id)
      .populate('parentId', 'name email phone')
      .populate('doctorId', 'name doctorId hospitalName specialization');

    res.json({
      success: true,
      data: updatedChild,
    });
  })
);

// ──────────────────────────────────────────────
// PATCH /:id/transfer — Transfer child to a different doctor
// ──────────────────────────────────────────────
router.patch(
  '/:id/transfer',
  protect,
  [
    body('newDoctorId').trim().notEmpty().withMessage('New Doctor ID is required'),
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

    const { id } = req.params;
    const { newDoctorId } = req.body;

    // 1. Find the child
    const child = await Child.findById(id);
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }

    // 2. Only the parent of the child or a doctor can transfer
    const isParent = child.parentId.toString() === req.user._id.toString();
    const isDoctor = req.user.role === 'doctor';
    if (!isParent && !isDoctor) {
      return res.status(403).json({
        success: false,
        error: 'Only the parent or a doctor can transfer a child',
      });
    }

    // 3. Find the target doctor by their doctorId (DOC-XXXXXX)
    const targetDoctor = await User.findOne({
      doctorId: newDoctorId.toUpperCase(),
      role: 'doctor',
    });

    if (!targetDoctor) {
      return res.status(404).json({
        success: false,
        error: `No doctor found with ID: ${newDoctorId}`,
      });
    }

    // 4. Check not transferring to the same doctor
    if (child.doctorId && child.doctorId.toString() === targetDoctor._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Child is already assigned to this doctor',
      });
    }

    // 5. Update the child's doctorId
    child.doctorId = targetDoctor._id;
    await child.save();

    const updatedChild = await Child.findById(id)
      .populate('parentId', 'name email phone')
      .populate('doctorId', 'name doctorId hospitalName specialization');

    console.log(
      `[TRANSFER] Child ${child.name} (${id}) transferred to Dr. ${targetDoctor.name} (${newDoctorId}) by user ${req.user._id}`
    );

    res.json({
      success: true,
      message: `Successfully transferred to Dr. ${targetDoctor.name}`,
      data: updatedChild,
    });
  })
);

export default router;


