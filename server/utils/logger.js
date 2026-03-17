import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({ userId, userModel, action, resource, resourceId = null, details = null, ipAddress = null }) => {
  try {
    await ActivityLog.create({
      user: userId,
      userModel,
      action,
      resource,
      resourceId,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};