// Example: Integrating notifications into Staff Controller
// This shows how to trigger notifications when actions occur

import Project from '../models/Project.js';
import Document from '../models/Document.js';
import Milestone from '../models/Milestone.js';
import User from '../models/User.js';
import {
  notifyProjectApproval,
  notifyProjectRejection,
  notifyDocumentReview,
  notifyMilestoneAssignment,
  notifyStatusUpdate
} from '../utils/notificationService.js';

// Example: Approve Project with Notification
export const approveProjectWithNotification = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { remarks } = req.body;

    const project = await Project.findById(projectId).populate('studentId');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.approvalStatus = 'Approved';
    project.remarks = remarks;
    await project.save();

    // Send notification to student
    await notifyProjectApproval(project, req.user);

    res.json({
      success: true,
      message: 'Project approved successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving project', error: error.message });
  }
};

// Example: Reject Project with Notification
export const rejectProjectWithNotification = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { remarks } = req.body;

    const project = await Project.findById(projectId).populate('studentId');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.approvalStatus = 'Rejected';
    project.remarks = remarks;
    await project.save();

    // Send notification to student
    await notifyProjectRejection(project, req.user);

    res.json({
      success: true,
      message: 'Project rejected',
      data: project
    });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting project', error: error.message });
  }
};

// Example: Review Document with Notification
export const reviewDocumentWithNotification = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { reviewStatus, remarks } = req.body;

    const document = await Document.findById(documentId).populate('studentId');
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.reviewStatus = reviewStatus;
    document.remarks = remarks;
    document.reviewedBy = req.user._id;
    document.reviewedAt = new Date();
    await document.save();

    // Send notification to student
    await notifyDocumentReview(document, req.user.name, reviewStatus);

    res.json({
      success: true,
      message: 'Document reviewed successfully',
      data: document
    });
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing document', error: error.message });
  }
};

// Example: Assign Milestone with Notification
export const assignMilestoneWithNotification = async (req, res) => {
  try {
    const { projectId, studentId, title, description, dueDate, priority } = req.body;

    const milestone = await Milestone.create({
      projectId,
      studentId,
      assignedBy: req.user._id,
      title,
      description,
      dueDate,
      priority: priority || 'Medium',
      status: 'Not Started'
    });

    // Send notification to student
    await notifyMilestoneAssignment(milestone, studentId, req.user.name);

    res.status(201).json({
      success: true,
      message: 'Milestone assigned successfully',
      data: milestone
    });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning milestone', error: error.message });
  }
};

// Example: Update Project Status with Notification
export const updateProjectStatusWithNotification = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    const project = await Project.findById(projectId).populate('studentId');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const oldStatus = project.status;
    project.status = status;
    await project.save();

    // Send notification if status changed
    if (oldStatus !== status) {
      await notifyStatusUpdate(project.studentId._id, project.title, status);
    }

    res.json({
      success: true,
      message: 'Project status updated',
      data: project
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

/* 
INTEGRATION GUIDE:

1. Import notification functions at the top of your controller:
   import { notifyProjectApproval, notifyDocumentReview, ... } from '../utils/notificationService.js';

2. Call notification functions after successful database operations:
   await notifyProjectApproval(project, req.user);

3. Common patterns:
   - After approving/rejecting: Send notification to student
   - After document review: Send notification to document owner
   - After milestone assignment: Send notification to assigned student
   - After team creation: Send notifications to all members
   - After status update: Send notification to affected user

4. Notifications are non-blocking - wrapped in try-catch in the service
5. Failed notifications won't break the main operation
6. All notifications automatically appear in user's notification center
7. Unread counts are tracked automatically
*/

export default {
  approveProjectWithNotification,
  rejectProjectWithNotification,
  reviewDocumentWithNotification,
  assignMilestoneWithNotification,
  updateProjectStatusWithNotification
};
