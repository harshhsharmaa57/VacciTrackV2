import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Child from '../models/Child.js';
import { generateAbhaId } from '../utils/generateAbhaId.js';
import { generateVaccineSchedule } from '../utils/vaccineSchedule.js';

const router = express.Router();

// @route   GET /api/children
// @desc    Get all children (filtered by role)
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  let query = {};

  // Parents can only see their own children
  if (req.user.role === 'parent') {
    query.parentId = req.user._id;
  }
  // Doctors can see all children

  const children = await Child.find(query).populate('parentId', 'name email phone').sort({ createdAt: -1 });

  res.json({
    success: true,
    count: children.length,
    data: children,
  });
}));

// @route   GET /api/children/search
// @desc    Search children by name or ABHA ID
// @access  Private (Doctors only)
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

// @route   GET /api/children/:id
// @desc    Get single child by ID
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id).populate('parentId', 'name email phone');

  if (!child) {
    return res.status(404).json({
      success: false,
      error: 'Child not found',
    });
  }

  // Check access: Parents can only see their own children
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

// @route   POST /api/children
// @desc    Create a new child
// @access  Private
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

    // Determine parent ID
    let finalParentId = req.user._id;
    if (req.user.role === 'doctor' && parentId) {
      finalParentId = parentId;
    }

    // Generate ABHA ID
    let abhaId = generateAbhaId();
    let abhaExists = await Child.findOne({ abhaId });
    while (abhaExists) {
      abhaId = generateAbhaId();
      abhaExists = await Child.findOne({ abhaId });
    }

    // Generate vaccine schedule
    const dob = new Date(dateOfBirth);
    const schedule = generateVaccineSchedule(dob);

    // Create child
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

// @route   PATCH /api/children/:id
// @desc    Update basic child details (name, DOB, gender)
// @access  Private (Doctors only)
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

// @route   DELETE /api/children/:id
// @desc    Delete a child record
// @access  Private (Doctors only)
router.delete(
  '/:id',
  protect,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const child = await Child.findById(id);
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }

    await child.deleteOne();

    res.json({
      success: true,
      message: 'Child deleted successfully',
    });
  })
);

// @route   PUT /api/children/:id/vaccines/:vaccineId
// @desc    Update vaccine status (mark as completed)
// @access  Private (Doctors only)
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

    // Find the vaccine in schedule
    const vaccine = child.schedule.find((v) => v.vaccineId === vaccineId);
    if (!vaccine) {
      return res.status(404).json({
        success: false,
        error: 'Vaccine not found in schedule',
      });
    }

    // Update vaccine status
    vaccine.status = 'COMPLETED';
    vaccine.administeredDate = administeredDate ? new Date(administeredDate) : new Date();

    // Save child
    await child.save();

    // Recalculate status for other vaccines (in case of dependencies)
    const dob = child.dateOfBirth;
    child.schedule.forEach((v) => {
      if (v.vaccineId !== vaccineId && !v.administeredDate) {
        // Recalculate status based on due date
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


