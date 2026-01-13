import Notification from '../models/Notification.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import Announcement from '../models/Announcement.js';
import Document from '../models/Document.js';
import { sendMail } from './mailer.js';

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

    // Send Email Notification to Guide
    if (project.assignedGuideId.email) {
      await sendMail({
        to: project.assignedGuideId.email,
        subject: '📄 New project report uploaded for review',
        text: `Dear ${project.assignedGuideId.name},\n\nStudent ${studentName} has uploaded a new document (${document.type}) for the project "${project.title}".\n\nPlease login to review it.\n\nRegards,\nProject Portal`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
              <h2 style="color: #4f46e5;">New Document Uploaded</h2>
              <p>Dear <strong>${project.assignedGuideId.name}</strong>,</p>
              <p>Student <strong>${studentName}</strong> has uploaded a new document for review.</p>
              <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                <p style="margin: 0;"><strong>Project:</strong> ${project.title}</p>
                <p style="margin: 5px 0 0;"><strong>Document Type:</strong> ${document.type}</p>
                <p style="margin: 5px 0 0;"><strong>File Name:</strong> ${document.fileName}</p>
              </div>
              <p>Please login to the portal to review this document.</p>
            </div>
          </div>
        `
      });
    }
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

  // Document review deadline reminders (documents still pending review)
  const pendingDocuments = await Document.find({
    reviewStatus: 'Pending',
    uploadedAt: { $lte: tomorrow }
  }).populate({
    path: 'projectId',
    populate: { path: 'assignedGuideId', model: 'Staff' }
  }).populate('studentId');

  for (const doc of pendingDocuments) {
    const guide = doc.projectId && doc.projectId.assignedGuideId;
    if (guide && guide.email) {
      // Send reminder email
      await import('./mailer.js').then(({ sendMail }) => sendMail({
        to: guide.email,
        subject: '⏰ Document Review Deadline Reminder',
        text: `Reminder: The document "${doc.fileName}" uploaded by ${doc.studentId?.name || 'a student'} is still pending your review. Please review it as soon as possible.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
              <h2 style="color: #eab308;">⏰ Document Review Deadline Reminder</h2>
              <p><strong>Document:</strong> ${doc.fileName}</p>
              <p><strong>Student:</strong> ${doc.studentId?.name || 'A student'}</p>
              <p>This document is still pending your review. Please log in to the portal to review it.</p>
            </div>
          </div>
        `
      }));
    }
  }

  // Find announcements with deadlines tomorrow
  const upcomingAnnouncements = await Announcement.find({
    deadline: { $gte: tomorrow, $lt: dayAfter }
  });

  for (const announcement of upcomingAnnouncements) {
    // Notify all target audience members
    // This would need user IDs from the announcement's targetAudience
  }

  console.log(`Sent ${upcomingMilestones.length} milestone and ${pendingDocuments.length} document deadline reminders`);

  // Find pending documents uploaded more than 3 days ago
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const overdueDocuments = await Document.find({
    reviewStatus: 'Pending',
    uploadedAt: { $lte: threeDaysAgo }
  }).populate({
    path: 'projectId',
    populate: { path: 'assignedGuideId' }
  }).populate('studentId', 'name');

  for (const doc of overdueDocuments) {
    if (doc.projectId && doc.projectId.assignedGuideId && doc.projectId.assignedGuideId.email) {
      const guide = doc.projectId.assignedGuideId;
      const studentName = doc.studentId ? doc.studentId.name : 'Student';

      await sendMail({
        to: guide.email,
        subject: '⏰ Reminder: Pending Document Review',
        text: `Dear ${guide.name},

This is a gentle reminder that a document submitted by ${studentName} is awaiting your review.

Document: ${doc.fileName}
Type: ${doc.type}
Uploaded On: ${new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}

Please review it at your convenience.

Best regards,
Project Portal Team
`,
        html: `
    <div style="margin:0; padding:0; background-color:#f3f4f6; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background:#ef4444; padding:20px; text-align:center;">
                  <h2 style="color:#ffffff; margin:0;">📄 Document Review Reminder</h2>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:24px; color:#374151;">
                  <p style="margin:0 0 12px;">Dear <strong>${guide.name}</strong>,</p>

                  <p style="margin:0 0 16px; line-height:1.6;">
                    This is a friendly reminder that the following document submitted by
                    <strong>${studentName}</strong> is still pending your review.
                  </p>

                  <div style="background:#fef2f2; border-left:4px solid #ef4444; padding:16px; border-radius:6px; margin-bottom:20px;">
                    <p style="margin:0;"><strong>📌 Student:</strong> ${studentName}</p>
                    <p style="margin:6px 0;"><strong>📄 Document:</strong> ${doc.fileName}</p>
                    <p style="margin:6px 0;"><strong>📂 Type:</strong> ${doc.type}</p>
                    <p style="margin:6px 0;"><strong>📅 Uploaded On:</strong> ${new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}</p>
                  </div>

                  <p style="margin:0 0 20px; line-height:1.6;">
                    Kindly review the document at your earliest convenience to avoid delays.
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align:center; margin-bottom:10px;">
                    <a href="#" style="background:#ef4444; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:6px; display:inline-block; font-weight:bold;">
                      Review Document
                    </a>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb; padding:16px; text-align:center; color:#6b7280; font-size:13px;">
                  Regards,<br>
                  <strong>Project Portal Team</strong>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>
  `
      });

    }
  }
  console.log(`Sent ${overdueDocuments.length} document review reminders`);
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
