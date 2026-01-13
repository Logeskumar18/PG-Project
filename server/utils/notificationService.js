import Notification from '../models/Notification.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import Announcement from '../models/Announcement.js';
import Document from '../models/Document.js';
import Progress from '../models/Progress.js';
import Staff from '../models/Staff.js';
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
  const studentId = document.studentId && document.studentId._id ? document.studentId._id : document.studentId;
  await createNotification({
    userId: studentId,
    type: 'DOCUMENT_REVIEWED',
    title: `Document ${status}`,
    message: `Your ${document.type} has been ${status.toLowerCase()} by ${reviewerName}`,
    relatedTo: { type: 'Document', referenceId: document._id },
    priority: status === 'Approved' ? 'Medium' : 'High',
    actionUrl: `/dashboard/student?tab=submissions`
  });

  // Send Email to Student
  const student = document.studentId;
  // Check if student object is populated (has email)
  if (student && student.email) {
    const isApproved = status === 'Approved';
    const color = isApproved ? '#10b981' : '#ef4444'; // Green or Red
    const subject = isApproved
      ? `✅ Document Approved: ${document.fileName}`
      : `⚠️ Document Review Update: ${document.fileName}`;

    await sendMail({
      to: student.email,
      subject: subject,
      text: `Dear ${student.name},

Your document "${document.fileName}" (${document.type}) has been reviewed by ${reviewerName}.

Status: ${status}
Remarks: ${document.remarks || 'No remarks provided.'}

Please log in to the Project Portal to view full details.

Regards,
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
                <td style="background:${color}; padding:20px; text-align:center;">
                  <h2 style="color:#ffffff; margin:0;">📄 Document ${status}</h2>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:24px; color:#374151;">
                  <p style="margin:0 0 12px;">Dear <strong>${student.name}</strong>,</p>

                  <p style="margin:0 0 16px; line-height:1.6;">
                    Your document has been successfully reviewed by
                    <strong>${reviewerName}</strong>. Please find the review details below:
                  </p>

                  <div style="background:#f9fafb; border-left:4px solid ${color}; padding:16px; border-radius:6px; margin-bottom:20px;">
                    <p style="margin:0;"><strong>📄 Document:</strong> ${document.fileName}</p>
                    <p style="margin:6px 0;"><strong>📂 Type:</strong> ${document.type}</p>
                    <p style="margin:6px 0;">
                      <strong>📌 Status:</strong>
                      <span style="color:${color}; font-weight:bold;">${status}</span>
                    </p>
                    <p style="margin:6px 0;">
                      <strong>📝 Remarks:</strong>
                      ${document.remarks || 'No remarks provided.'}
                    </p>
                  </div>

                  <p style="margin:0 0 20px; line-height:1.6;">
                    Please log in to the portal to view complete details or take further action if required.
                  </p>

                  <!-- CTA -->
                  <div style="text-align:center;">
                    <a href="#" style="background:${color}; color:#ffffff; text-decoration:none; padding:12px 26px; border-radius:6px; font-weight:bold; display:inline-block;">
                      View in Project Portal
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

export const notifyProgressSubmission = async (progress, projectOrTeam, type = 'Project') => {
  // Handle both Project (solo) and Team
  let guideId = type === 'Team' ? projectOrTeam.guideId : projectOrTeam.assignedGuideId;
  let title = type === 'Team' ? projectOrTeam.name : projectOrTeam.title;
  let referenceId = type === 'Team' ? projectOrTeam._id : progress._id; // Link to team or progress
  let actionUrl = type === 'Team' ? `/team/${projectOrTeam._id}?tab=progress` : `/dashboard/staff?tab=progress`;

  if (guideId) {
    // Ensure we have the guide object with email
    let guide = guideId;
    if (!guide.email) {
      guide = await Staff.findById(guideId);
    }

    if (guide) {
      await createNotification({
        userId: guide._id,
        type: 'PROGRESS_SUBMITTED',
        title: '📈 Progress Update Submitted',
        message: `New progress update for ${type.toLowerCase()}: ${title} (Week ${progress.weekNumber})`,
        relatedTo: { type: type === 'Team' ? 'Team' : 'Progress', referenceId: referenceId },
        priority: 'Low',
        actionUrl: actionUrl
      });

      // Send Email to Guide
      await sendMail({
        to: guide.email,
        subject: `📈 Progress Update: ${title} - Week ${progress.weekNumber}`,
        text: `Dear ${guide.name},\n\nA new progress update has been submitted for ${title}.\n\nWeek: ${progress.weekNumber}\nProgress: ${progress.progressPercentage}%\nDescription: ${progress.description}\n\nPlease login to review.\n\nRegards,\nProject Portal`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
              <h2 style="color: #4f46e5;">Progress Update Submitted</h2>
              <p>Dear <strong>${guide.name}</strong>,</p>
              <p>A new progress update has been submitted.</p>
              <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                <p style="margin: 0;"><strong>${type}:</strong> ${title}</p>
                <p style="margin: 5px 0 0;"><strong>Week:</strong> ${progress.weekNumber}</p>
                <p style="margin: 5px 0 0;"><strong>Progress:</strong> ${progress.progressPercentage}%</p>
                <p style="margin: 5px 0 0;"><strong>Description:</strong> ${progress.description}</p>
              </div>
              <p>Please login to the portal to review this update.</p>
            </div>
          </div>
        `
      });
    }
  }
};

export const notifyProgressReview = async (progress, reviewerName) => {
  const studentId = progress.studentId;
  if (!studentId) return;

  // Populate student if needed
  let student = studentId;
  if (!student.email) {
    // Dynamic import to avoid circular dependency if Student imports notificationService
    const Student = (await import('../models/Student.js')).default;
    student = await Student.findById(studentId);
  }

  if (student) {
    const isSatisfactory = progress.status === 'Satisfactory';
    const color = isSatisfactory ? '#10b981' : '#ef4444';

    await createNotification({
      userId: student._id,
      type: 'PROGRESS_REVIEWED',
      title: `Progress Update ${progress.status}`,
      message: `Your Week ${progress.weekNumber} progress has been marked as ${progress.status}.`,
      relatedTo: { type: 'Progress', referenceId: progress._id },
      priority: isSatisfactory ? 'Low' : 'High',
      actionUrl: `/dashboard/student?tab=progress`
    });

    // Send Email
    await sendMail({
      to: student.email,
      subject: `${isSatisfactory ? '✅' : '⚠️'} Progress Update: ${progress.status}`,
      text: `Dear ${student.name},\n\nYour progress update for Week ${progress.weekNumber} has been reviewed by ${reviewerName}.\n\nStatus: ${progress.status}\nFeedback: ${progress.feedback || 'None'}\n\nRegards,\nProject Portal`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
            <h2 style="color: ${color};">Progress ${progress.status}</h2>
            <p>Dear <strong>${student.name}</strong>,</p>
            <p>Your progress update for <strong>Week ${progress.weekNumber}</strong> has been reviewed.</p>
            <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0;">
              <p style="margin: 0;"><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${progress.status}</span></p>
              <p style="margin: 5px 0 0;"><strong>Feedback:</strong> ${progress.feedback || 'No feedback provided.'}</p>
            </div>
            ${!isSatisfactory ? '<p style="color: #ef4444;"><strong>Action Required:</strong> Please address the feedback and ensure your progress is on track.</p>' : ''}
            <p>Regards,<br>Project Portal Team</p>
          </div>
        </div>
      `
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
export const notifyAnnouncement = async (announcement, recipients, isUpdate = false) => {
  const actionWord = isUpdate ? 'Updated' : 'Published';
  const titlePrefix = isUpdate ? '📝 Announcement Updated' : '📢 New Announcement';
  const priority = ['Important', 'Deadline'].includes(announcement.type) ? 'High' : 'Medium';

  // 1. In-app notifications
  const notifications = recipients.map(user => ({
    userId: user._id,
    type: 'ANNOUNCEMENT_POSTED',
    title: titlePrefix,
    message: `${announcement.title} has been ${actionWord.toLowerCase()}.`,
    relatedTo: { type: 'Announcement', referenceId: announcement._id },
    priority: priority,
    actionUrl: `/dashboard`,
    expiresAt: announcement.deadline
  }));

  await createBulkNotifications(notifications);

  // 2. Email Notifications
  const emailSubject = `📢 Announcement ${actionWord}: ${announcement.title}`;

  // Send emails (using Promise.all to send in parallel)
  const emailPromises = recipients.map(user => {
    if (!user.email) return Promise.resolve();

    return sendMail({
      to: user.email,
      subject: emailSubject,
      text: `Dear ${user.name},\n\n${titlePrefix}: ${announcement.title}\n\n${announcement.message}\n\nRegards,\nProject Portal`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
            <h2 style="color: #4f46e5;">${titlePrefix}</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
              <h3 style="margin: 0 0 10px;">${announcement.title}</h3>
              <p style="margin: 0; white-space: pre-wrap;">${announcement.message}</p>
              ${announcement.deadline ? `<p style="margin-top: 10px; color: #ef4444;"><strong>Deadline:</strong> ${new Date(announcement.deadline).toLocaleDateString()}</p>` : ''}
            </div>
            <p>Please login to the portal for more details.</p>
          </div>
        </div>
      `
    }).catch(err => console.error(`Failed to send announcement email to ${user.email}`, err));
  });

  await Promise.all(emailPromises);
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

  // Check for missed progress updates (e.g., no update in last 7 days for active projects)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Find active projects
  const activeProjects = await Project.find({ status: 'In Progress' }).populate('studentId');

  for (const project of activeProjects) {
    // Check if progress submitted in last 7 days
    const recentProgress = await Progress.findOne({
      projectId: project._id,
      submittedAt: { $gte: sevenDaysAgo }
    });

    if (!recentProgress && project.studentId && project.studentId.email) {
      // Send reminder
      awaitsendMail({
  to: project.studentId.email,
  subject: '⚠️ Action Required: Project Progress Update Pending',
  text: `Dear ${project.studentId.name},

Our records show that you have not submitted a progress update for your project "${project.title}" in the past 7 days.

Regular progress updates help us track your work and provide timely guidance. Please log in to the Project Portal and submit your update as soon as possible.

If you have already submitted the update, please ignore this message.

Regards,
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
                <td style="background:#f59e0b; padding:20px; text-align:center;">
                  <h2 style="color:#ffffff; margin:0;">⚠️ Progress Update Pending</h2>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:24px; color:#374151;">
                  <p style="margin:0 0 12px;">Dear <strong>${project.studentId.name}</strong>,</p>

                  <p style="margin:0 0 16px; line-height:1.6;">
                    We noticed that you haven’t submitted a progress update for your project
                    <strong>${project.title}</strong> within the last <strong>7 days</strong>.
                  </p>

                  <div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:16px; border-radius:6px; margin-bottom:20px;">
                    <p style="margin:0;">
                      Regular progress updates are essential for monitoring your work and receiving timely feedback.
                    </p>
                  </div>

                  <p style="margin:0 0 20px; line-height:1.6;">
                    Please log in to the Project Portal and submit your weekly progress update at the earliest.
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align:center;">
                    <a href="#" style="background:#f59e0b; color:#ffffff; text-decoration:none; padding:12px 26px; border-radius:6px; font-weight:bold; display:inline-block;">
                      Submit Progress Update
                    </a>
                  </div>

                  <p style="margin:20px 0 0; font-size:13px; color:#6b7280;">
                    If you have already submitted the update, please ignore this message.
                  </p>
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
};

// Security Notifications
export const notifyLogin = async (user, req) => {
  if (!user.email) return;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  const time = new Date().toLocaleString();

  await sendMail({
  to: user.email,
  subject: '🔐 Security Alert: New Login Detected',
  text: `Dear ${user.name},

We noticed a new login to your Project Portal account. Here are the details:

Time: ${time}
IP Address: ${ip}
Device: ${userAgent}

If this was you, no action is needed.
If you do not recognize this activity, please secure your account immediately by changing your password or contacting support.

Regards,
Project Portal Security Team
`,
  html: `
    <div style="margin:0; padding:0; background-color:#f3f4f6; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background:#4f46e5; padding:20px; text-align:center;">
                  <h2 style="color:#ffffff; margin:0;">🔐 New Login Detected</h2>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:24px; color:#374151;">
                  <p style="margin:0 0 12px;">Dear <strong>${user.name}</strong>,</p>

                  <p style="margin:0 0 16px; line-height:1.6;">
                    We detected a new login to your Project Portal account. Please review the login details below:
                  </p>

                  <div style="background:#f9fafb; border-left:4px solid #4f46e5; padding:16px; border-radius:6px; margin-bottom:20px;">
                    <p style="margin:0;"><strong>🕒 Time:</strong> ${time}</p>
                    <p style="margin:6px 0;"><strong>🌐 IP Address:</strong> ${ip}</p>
                    <p style="margin:6px 0;"><strong>💻 Device:</strong> ${userAgent}</p>
                  </div>

                  <div style="background:#eef2ff; padding:14px; border-radius:6px; margin-bottom:20px;">
                    <p style="margin:0; font-size:14px;">
                      ✅ <strong>If this was you:</strong> No action is required.<br>
                      ⚠️ <strong>If this wasn’t you:</strong> Please change your password immediately and contact support.
                    </p>
                  </div>

                  <!-- CTA -->
                  <div style="text-align:center;">
                    <a href="#" style="background:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 26px; border-radius:6px; font-weight:bold; display:inline-block;">
                      Secure My Account
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb; padding:16px; text-align:center; color:#6b7280; font-size:13px;">
                  Stay safe,<br>
                  <strong>Project Portal Security Team</strong>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>
  `
});

};

export const notifyPasswordChange = async (user) => {
  if (!user.email) return;

  await sendMail({
    to: user.email,
    subject: '🔐 Security Alert: Password Changed',
    text: `Dear ${user.name},\n\nYour account password was recently changed.\n\nIf you did not make this change, please contact support immediately.\n\nRegards,\nProject Portal`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
          <h2 style="color: #ef4444;">🔐 Password Changed</h2>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Your account password was recently changed.</p>
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="margin: 0; color: #b91c1c;">If you did not make this change, please contact support immediately.</p>
          </div>
          <p>Regards,<br>Project Portal Team</p>
        </div>
      </div>
    `
  });
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
  notifyProgressReview,
  notifyGuideAssignment,
  notifyStatusUpdate,
  notifyAnnouncement,
  sendDeadlineReminders,
  notifyLogin,
  notifyPasswordChange
};
