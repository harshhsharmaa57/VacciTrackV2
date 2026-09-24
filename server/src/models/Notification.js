import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      index: true,
    },
    type: {
      type: String,
      enum: ['OVERDUE', 'UPCOMING', 'COMPLETED', 'DOCTOR_REMINDER'],
      required: true,
      default: 'UPCOMING',
    },
    priority: {
      type: String,
      enum: ['urgent', 'warning', 'info'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick query by user and unread status
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
