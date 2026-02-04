import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Child from '../models/Child.js';
import User from '../models/User.js';
import { generateAbhaId } from '../utils/generateAbhaId.js';
import { generateVaccineSchedule } from '../utils/vaccineSchedule.js';

const router = express.Router();

router.get('/', protect, asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'parent') {
    query.parentId = req.user._id;
  }

  const children = await Child.find(query).populate('parentId', 'name email phone').sort({ createdAt: -1 });

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
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { abhaId: q },
    ],
  }).populate('parentId', 'name email phone');

  res.json({
    success: true,
    count: children.length,
    data: children,
  });
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id).populate('parentId', 'name email phone');

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

    const { name, dateOfBirth, gender, parentId } = req.body;

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

    const child = await Child.create({
      parentId: finalParentId,
      name,
      dateOfBirth: dob,
      gender,
      abhaId,
      schedule,
    });

    const populatedChild = await Child.findById(child._id).populate('parentId', 'name email phone');

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
    const { name, dateOfBirth, gender } = req.body;

    const child = await Child.findById(id);
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
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

    const updatedChild = await Child.findById(id).populate('parentId', 'name email phone');

    res.json({
      success: true,
      data: updatedChild,
    });
  })
);

export default router;


