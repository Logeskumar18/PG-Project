import Project from '../models/Project.js';
import Document from '../models/Document.js';
import Milestone from '../models/Milestone.js';
import Staff from '../models/Staff.js';
import { notifyProjectApproval, notifyProjectRejection } from '../utils/notificationService.js';

// Get assigned students
export const getAssignedStudents = async (req, res) => {
  try {
    const staffId = req.user.id;
    // Get all projects assigned to this staff member
    const projects = await Project.find({ assignedGuideId: staffId })
      .populate({
        path: 'studentId',
        model: 'Student',
        select: 'name email studentId department'
      })
      .lean();

    const students = [];
    const seen = new Set();
    for (const project of projects) {
      const s = project.studentId;
      if (s && s._id && !seen.has(s._id.toString())) {
        students.push({
          _id: s._id,
          name: s.name,
          email: s.email,
          studentId: s.studentId,
          department: s.department,
          projectCount: 1,
          projectStatus: project.status
        });
        seen.add(s._id.toString());
      }
    }

    res.json({
      status: 'success',
      data: {
        students: students,
        totalStudents: students.length
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all projects for staff
export const getStaffProjects = async (req, res) => {
  try {
    const staffId = req.user.id;
    
    const projects = await Project.find({ assignedGuideId: staffId })
      .populate('studentId', 'name email studentId')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Approve project title
export const approveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { remarks } = req.body;

    const projectOwned = await Project.findOne({ _id: projectId, assignedGuideId: req.user.id });
    if (!projectOwned) {
      return res.status(403).json({
        status: 'error',
        message: 'Project not found or not assigned to you'
      });
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        approvalStatus: 'Approved',
        status: 'Approved',
        approvalRemarks: remarks,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('studentId', 'name email');

    // Notify student
    await notifyProjectApproval(project, req.user);

    res.json({
      status: 'success',
      message: 'Project approved successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Reject project title
export const rejectProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { remarks } = req.body;

    const projectOwned = await Project.findOne({ _id: projectId, assignedGuideId: req.user.id });
    if (!projectOwned) {
      return res.status(403).json({
        status: 'error',
        message: 'Project not found or not assigned to you'
      });
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        approvalStatus: 'Rejected',
        status: 'Rejected',
        approvalRemarks: remarks,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('studentId', 'name email');

    // Notify student
    await notifyProjectRejection(project, req.user);

    res.json({
      status: 'success',
      message: 'Project rejected',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get documents for review
export const getDocumentsForReview = async (req, res) => {
  try {
    const staffId = req.user.id;
    
    // Get all documents from projects assigned to this staff
    const projects = await Project.find({ assignedGuideId: staffId }).select('_id');
    const projectIds = projects.map(p => p._id);

    const documents = await Document.find({ projectId: { $in: projectIds } })
      .populate('studentId', 'name email studentId')
      .populate('projectId', 'title')
      .sort({ uploadedAt: -1 });

    res.json({
      status: 'success',
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Review document and add remarks
export const reviewDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { reviewStatus, remarks } = req.body;

    const document = await Document.findById(documentId).populate('projectId', 'assignedGuideId title').populate('studentId', 'name email');
    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    if (document.projectId.assignedGuideId?.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You cannot review documents for unassigned projects'
      });
    }

    const updated = await Document.findByIdAndUpdate(
      documentId,
      {
        reviewStatus,
        remarks,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('studentId', 'name email')
      .populate('projectId', 'title');

    res.json({
      status: 'success',
      message: 'Document reviewed successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create milestone/task
export const createMilestone = async (req, res) => {
  try {
    const { projectId, studentId, title, description, dueDate, priority } = req.body;

    const project = await Project.findOne({ _id: projectId, assignedGuideId: req.user.id });
    if (!project) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot create milestone for an unassigned project'
      });
    }

    if (project.studentId?.toString() !== studentId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Student does not belong to this project'
      });
    }

    const milestone = new Milestone({
      projectId,
      studentId,
      assignedBy: req.user.id,
      title,
      description,
      dueDate,
      priority
    });

    await milestone.save();

    res.status(201).json({
      status: 'success',
      message: 'Milestone created successfully',
      data: milestone
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get milestones for a student
export const getStudentMilestones = async (req, res) => {
  try {
    const { studentId } = req.params;
    const projectIds = await Project.find({ assignedGuideId: req.user.id }).distinct('_id');

    const milestones = await Milestone.find({ studentId, projectId: { $in: projectIds } })
      .populate('projectId', 'title')
      .sort({ dueDate: 1 });

    if (!milestones.length) {
      return res.status(404).json({
        status: 'error',
        message: 'No milestones found for this student under your supervision'
      });
    }

    res.json({
      status: 'success',
      data: milestones
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update milestone status
export const updateMilestoneStatus = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { status } = req.body;

    const projectIds = await Project.find({ assignedGuideId: req.user.id }).distinct('_id');

    const milestone = await Milestone.findOneAndUpdate(
      { _id: milestoneId, projectId: { $in: projectIds } },
      {
        status,
        completedAt: status === 'Completed' ? new Date() : null
      },
      { new: true }
    );

    if (!milestone) {
      return res.status(404).json({
        status: 'error',
        message: 'Milestone not found or not under your supervision'
      });
    }

    res.json({
      status: 'success',
      message: 'Milestone updated successfully',
      data: milestone
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update project status
export const updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: projectId, assignedGuideId: req.user.id },
      { status },
      { new: true }
    ).populate('studentId', 'name email');

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found or not assigned to you'
      });
    }

    res.json({
      status: 'success',
      message: 'Project status updated successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get dashboard overview for staff
export const getDashboardOverview = async (req, res) => {
  try {
    const staffId = req.user.id;

    const totalProjects = await Project.countDocuments({ assignedGuideId: staffId });
    const pendingApprovals = await Project.countDocuments({ 
      assignedGuideId: staffId,
      approvalStatus: 'Pending'
    });
    const approvedProjects = await Project.countDocuments({
      assignedGuideId: staffId,
      approvalStatus: 'Approved'
    });
    const pendingDocuments = await Document.countDocuments({
      reviewStatus: 'Pending',
      projectId: { $in: (await Project.find({ assignedGuideId: staffId }).select('_id')).map(p => p._id) }
    });

    const recentProjects = await Project.find({ assignedGuideId: staffId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      status: 'success',
      data: {
        totalProjects,
        pendingApprovals,
        approvedProjects,
        pendingDocuments,
        recentProjects
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Assign guide to student project
export const assignGuideToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { guideId } = req.body;

    return res.status(403).json({
      status: 'error',
      message: 'Staff cannot reassign guides to projects'
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
