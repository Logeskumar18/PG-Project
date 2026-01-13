import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'PROJECT_SUBMITTED',
      'PROJECT_APPROVED',
      'PROJECT_REJECTED',
      'DOCUMENT_SUBMITTED',
      'DOCUMENT_REVIEWED',
      'MILESTONE_ASSIGNED',
      'MILESTONE_DUE',
      'DEADLINE_REMINDER',
      'TEAM_CREATED',
      'TEAM_MEMBER_ADDED',
      'PROGRESS_SUBMITTED',
      'PROGRESS_REVIEWED',
      'MESSAGE_RECEIVED',
      'ANNOUNCEMENT_POSTED',
      'GUIDE_ASSIGNED',
      'STATUS_UPDATED'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['Project', 'Document', 'Milestone', 'Team', 'Message', 'Announcement'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTo.type'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  actionUrl: {
    type: String // Frontend URL to navigate when notification is clicked
  },
  expiresAt: {
    type: Date // For time-sensitive notifications
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired notifications

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
