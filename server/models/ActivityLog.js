import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel',
    required: true
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Staff', 'Student', 'HOD', 'Admin']
  },
  action: {
    type: String,
    required: true // e.g., 'CREATED', 'UPDATED', 'DELETED', 'LOGIN'
  },
  resource: {
    type: String, // e.g., 'Project', 'Student', 'Marks', 'Message'
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible field for storing previous/new values
  },
  ipAddress: String
}, { timestamps: true });

export default mongoose.model('ActivityLog', activityLogSchema);