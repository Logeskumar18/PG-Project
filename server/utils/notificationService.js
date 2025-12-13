import Notification from '../models/Notification.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import Announcement from '../models/Announcement.js';

// Notification creator utility
export const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Bulk notification creator
export const createBulkNotifications = async (notificationArray) => {
  try {
    const notifications = await Notification.insertMany(notificationArray);
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return null;
  }
};

// Project-related notifications
export const notifyProjectSubmission = async (project) => {
  if (project.assignedGuideId) {
    await createNotification({
      userId: project.assignedGuideId,
      type: 'PROJECT_SUBMITTED',
      title: 'New Project Submitted',
      message: `${project.studentId.name || 'A student'} submitted project: ${project.title}`,
      relatedTo: { type: 'Project', referenceId: project._id },
      priority: 'High',
      actionUrl: `/dashboard/staff?tab=approvals`
    });
  }
};

export const notifyProjectApproval = async (project, approvedBy) => {
  await createNotification({
    userId: project.studentId,
    type: 'PROJECT_APPROVED',
    title: '✅ Project Approved!',
    message: `Your project "${project.title}" has been approved by ${approvedBy.name}`,
    relatedTo: { type: 'Project', referenceId: project._id },
    priority: 'High',
    actionUrl: `/dashboard/student?tab=status`
  });
};

export const notifyProjectRejection = async (project, rejectedBy) => {
  await createNotification({
    userId: project.studentId,
    type: 'PROJECT_REJECTED',
    title: '❌ Project Needs Revision',
    message: `Your project "${project.title}" needs revision. Check remarks from ${rejectedBy.name}`,
    relatedTo: { type: 'Project', referenceId: project._id },
    priority: 'High',
    actionUrl: `/dashboard/student?tab=project`
  });
};

// Document-related notifications
export const notifyDocumentSubmission = async (document, studentName) => {
  const project = await Project.findById(document.projectId).populate('assignedGuideId');
  if (project && project.assignedGuideId) {
    await createNotification({
      userId: project.assignedGuideId._id,
      type: 'DOCUMENT_SUBMITTED',
      title: 'New Document Uploaded',
      message: `${studentName} uploaded ${document.type}: ${document.fileName}`,
      relatedTo: { type: 'Document', referenceId: document._id },
      priority: 'Medium',
      actionUrl: `/dashboard/staff?tab=documents`
    });
  }
};

export const notifyDocumentReview = async (document, reviewerName, status) => {
  await createNotification({
    userId: document.studentId,
    type: 'DOCUMENT_REVIEWED',
    title: `Document ${status}`,
    message: `Your ${document.type} has been ${status.toLowerCase()} by ${reviewerName}`,
    relatedTo: { type: 'Document', referenceId: document._id },
    priority: status === 'Approved' ? 'Medium' : 'High',
    actionUrl: `/dashboard/student?tab=submissions`
  });
};

// Milestone-related notifications
export const notifyMilestoneAssignment = async (milestone, studentId, assignerName) => {
  await createNotification({
    userId: studentId,
    type: 'MILESTONE_ASSIGNED',
    title: '🎯 New Milestone Assigned',
    message: `${assignerName} assigned milestone: ${milestone.title}`,
    relatedTo: { type: 'Milestone', referenceId: milestone._id },
    priority: milestone.priority === 'High' ? 'High' : 'Medium',
    actionUrl: `/dashboard/student?tab=status`
  });
};

export const notifyMilestoneDueSoon = async (milestone, studentId) => {
  const dueDate = new Date(milestone.dueDate);
  const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
  
  await createNotification({
    userId: studentId,
    type: 'MILESTONE_DUE',
    title: '⏰ Milestone Due Soon',
    message: `"${milestone.title}" is due in ${daysUntilDue} day(s)`,
    relatedTo: { type: 'Milestone', referenceId: milestone._id },
    priority: daysUntilDue <= 1 ? 'High' : 'Medium',
    actionUrl: `/dashboard/student?tab=status`,
    expiresAt: milestone.dueDate
  });
};

// Team-related notifications
export const notifyTeamCreation = async (team, memberIds) => {
  const notifications = memberIds.map(memberId => ({
    userId: memberId,
    type: 'TEAM_CREATED',
    title: '👥 Added to Team',
    message: `You have been added to team: ${team.name}`,
    relatedTo: { type: 'Team', referenceId: team._id },
    priority: 'Medium',
    actionUrl: `/team/${team._id}`
  }));

  await createBulkNotifications(notifications);
};

export const notifyTeamMemberAdded = async (team, newMemberId) => {
  await createNotification({
    userId: newMemberId,
    type: 'TEAM_MEMBER_ADDED',
    title: '👥 Added to Team',
    message: `You have been added to team: ${team.name}`,
    relatedTo: { type: 'Team', referenceId: team._id },
    priority: 'Medium',
    actionUrl: `/team/${team._id}`
  });
};

export const notifyProgressSubmission = async (progress, team) => {
  if (team.guideId) {
    await createNotification({
      userId: team.guideId,
      type: 'PROGRESS_SUBMITTED',
      title: '📈 Team Progress Updated',
      message: `${team.name} submitted week ${progress.weekNumber} progress`,
      relatedTo: { type: 'Team', referenceId: team._id },
      priority: 'Low',
      actionUrl: `/team/${team._id}?tab=progress`
    });
  }
};

// Guide assignment notification
export const notifyGuideAssignment = async (studentId, guideName, projectTitle) => {
  await createNotification({
    userId: studentId,
    type: 'GUIDE_ASSIGNED',
    title: '👨‍🏫 Guide Assigned',
    message: `${guideName} has been assigned as your guide for "${projectTitle}"`,
    priority: 'High',
    actionUrl: `/dashboard/student?tab=project`
  });
};

// Status update notification
export const notifyStatusUpdate = async (studentId, projectTitle, newStatus) => {
  await createNotification({
    userId: studentId,
    type: 'STATUS_UPDATED',
    title: '📊 Project Status Updated',
    message: `Your project "${projectTitle}" status changed to: ${newStatus}`,
    priority: 'Medium',
    actionUrl: `/dashboard/student?tab=status`
  });
};

// Announcement notification
export const notifyAnnouncement = async (announcement, targetUserIds) => {
  const notifications = targetUserIds.map(userId => ({
    userId,
    type: 'ANNOUNCEMENT_POSTED',
    title: '📢 New Announcement',
    message: announcement.title,
    relatedTo: { type: 'Announcement', referenceId: announcement._id },
    priority: announcement.type === 'Urgent' ? 'High' : 'Medium',
    actionUrl: `/dashboard`,
    expiresAt: announcement.deadline
  }));

  await createBulkNotifications(notifications);
};

// Deadline reminder scheduler (to be called by cron job)
export const sendDeadlineReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  // Find milestones due tomorrow
  const upcomingMilestones = await Milestone.find({
    dueDate: { $gte: tomorrow, $lt: dayAfter },
    status: { $ne: 'Completed' }
  });

  for (const milestone of upcomingMilestones) {
    await notifyMilestoneDueSoon(milestone, milestone.studentId);
  }

  // Find announcements with deadlines tomorrow
  const upcomingAnnouncements = await Announcement.find({
    deadline: { $gte: tomorrow, $lt: dayAfter }
  });

  for (const announcement of upcomingAnnouncements) {
    // Notify all target audience members
    // This would need user IDs from the announcement's targetAudience
  }

  console.log(`Sent ${upcomingMilestones.length} deadline reminders`);
};

export default {
  createNotification,
  createBulkNotifications,
  notifyProjectSubmission,
  notifyProjectApproval,
  notifyProjectRejection,
  notifyDocumentSubmission,
  notifyDocumentReview,
  notifyMilestoneAssignment,
  notifyMilestoneDueSoon,
  notifyTeamCreation,
  notifyTeamMemberAdded,
  notifyProgressSubmission,
  notifyGuideAssignment,
  notifyStatusUpdate,
  notifyAnnouncement,
  sendDeadlineReminders
};
