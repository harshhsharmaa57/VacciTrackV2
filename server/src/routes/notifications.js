import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Notification from '../models/Notification.js';
import Child from '../models/Child.js';
import User from '../models/User.js';
import { maskPhone } from '../utils/smsService.js';

const router = express.Router();

// Helper to auto-sync overdue & upcoming notifications for a parent
const syncParentNotifications = async (userId) => {
  const children = await Child.find({ parentId: userId });
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  for (const child of children) {
    for (const v of child.schedule || []) {
      if (v.status === 'OVERDUE') {
        const existing = await Notification.findOne({
          userId,
          childId: child._id,
          'metadata.vaccineId': v.vaccineId,
          type: 'OVERDUE',
        });

        if (!existing) {
          const doseStr = v.doseNumber ? ` (Dose ${v.doseNumber})` : '';
          await Notification.create({
            userId,
            childId: child._id,
            type: 'OVERDUE',
            priority: 'urgent',
            title: `Overdue Vaccine: ${v.shortName}`,
            message: `${child.name}'s ${v.name}${doseStr} is overdue past grace window. Please schedule a clinic visit.`,
            metadata: {
              vaccineId: v.vaccineId,
              shortName: v.shortName,
              dueDate: v.dueDate,
              childName: child.name,
            },
          });
        }
      } else if (v.status === 'PENDING' || (v.status === 'UPCOMING' && new Date(v.dueDate) <= thirtyDaysFromNow)) {
        const existing = await Notification.findOne({
          userId,
          childId: child._id,
          'metadata.vaccineId': v.vaccineId,
          type: 'UPCOMING',
        });

        if (!existing) {
          const doseStr = v.doseNumber ? ` (Dose ${v.doseNumber})` : '';
          await Notification.create({
            userId,
            childId: child._id,
            type: 'UPCOMING',
            priority: 'warning',
            title: `Upcoming Dose: ${v.shortName}`,
            message: `${child.name}'s ${v.name}${doseStr} is due soon. Ensure child is prepared for vaccination.`,
            metadata: {
              vaccineId: v.vaccineId,
              shortName: v.shortName,
              dueDate: v.dueDate,
              childName: child.name,
            },
          });
        }
      }
    }
  }
};

// @route   GET /api/notifications
// @desc    Get user notifications (auto-syncs schedule alerts)
// @access  Private
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    // If parent, check and generate fresh notifications
    if (req.user.role === 'parent') {
      try {
        await syncParentNotifications(req.user._id);
      } catch (err) {
        console.error('Failed to sync parent notifications:', err.message);
      }
    }

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  })
);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.patch(
  '/:id/read',
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  })
);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all user notifications as read
// @access  Private
router.patch(
  '/read-all',
  protect,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  })
);

// @route   POST /api/notifications/send-reminder
// @desc    Doctor dispatches immunization reminder to parent
// @access  Private (Doctor only)
router.post(
  '/send-reminder',
  protect,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const { childId, message } = req.body;

    if (!childId) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required',
      });
    }

    const child = await Child.findById(childId).populate('parentId');
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }

    const parent = child.parentId;
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent account not found for this child',
      });
    }

    // Create urgent in-app notification for the parent
    const rawDoctorName = req.user.name || 'Your Assigned Doctor';
    const doctorName = rawDoctorName.toLowerCase().startsWith('dr') ? rawDoctorName : `Dr. ${rawDoctorName}`;
    const doctorHospital = req.user.hospitalName || 'Immunization Clinic';
    const defaultMsg = `${doctorName} (${doctorHospital}) has issued an urgent vaccination reminder for ${child.name}. Please visit the clinic or book an appointment.`;

    const reminder = await Notification.create({
      userId: parent._id,
      childId: child._id,
      type: 'DOCTOR_REMINDER',
      priority: 'urgent',
      title: `Clinic Reminder: ${doctorName}`,
      message: message || defaultMsg,
      metadata: {
        doctorId: req.user._id,
        doctorName,
        childName: child.name,
      },
    });

    // Dev log reminder dispatch
    console.log(
      `[REMINDER] 📲 Doctor ${doctorName} sent reminder to ${parent.name} (${maskPhone(parent.phone)}) for child ${child.name}`
    );

    res.json({
      success: true,
      message: `Reminder sent to ${parent.name}`,
      data: reminder,
    });
  })
);

export default router;
