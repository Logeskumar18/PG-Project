import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['General', 'Deadline', 'Important', 'Event'],
      default: 'General'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Students', 'Staff'],
      default: 'All'
    },
    deadline: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model('Announcement', announcementSchema);
