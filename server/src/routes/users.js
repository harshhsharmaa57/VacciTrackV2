import express from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import User from '../models/User.js';
import Child from '../models/Child.js';

const router = express.Router();

router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
}));

router.delete('/me', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (req.user.role === 'doctor') {
    const fallbackDoctor = await User.findOne({
      role: 'doctor',
      _id: { $ne: userId },
    }).select('_id');

    if (fallbackDoctor) {
      await Child.updateMany(
        { doctorId: userId },
        { $set: { doctorId: fallbackDoctor._id } }
      );
    } else {
      await Child.updateMany(
        { doctorId: userId },
        { $unset: { doctorId: 1 } }
      );
    }
  }

  if (req.user.role === 'parent') {
    await Child.deleteMany({ parentId: userId });
  }

  await User.findByIdAndDelete(userId);

  res.json({
    success: true,
    message: 'Account deleted successfully',
  });
}));

// ──────────────────────────────────────────────
// GET /doctor/:doctorId — Lookup doctor by DOC-XXXXXX ID
// Public-ish (requires auth but any role can use)
// ──────────────────────────────────────────────
router.get('/doctor/:doctorId', protect, asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const doctor = await User.findOne({
    doctorId: doctorId.toUpperCase(),
    role: 'doctor',
  }).select('name doctorId hospitalName specialization');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      error: `No doctor found with ID: ${doctorId}`,
    });
  }

  res.json({
    success: true,
    data: doctor,
  });
}));

export default router;
