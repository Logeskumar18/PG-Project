// HOD: Reassign student to another staff (update createdByStaffId)
export const reassignStudentToStaff = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { staffId } = req.body;
    // Validate staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ status: 'error', message: 'Staff not found' });
    }
    // Update student ownership
    const student = await Student.findByIdAndUpdate(
      studentId,
      { createdByStaffId: staffId },
      { new: true }
    ).select('name email studentId department createdByStaffId');
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }
    res.json({
      status: 'success',
      message: 'Student reassigned to staff successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
import Project from '../models/Project.js';
import Document from '../models/Document.js';
import Milestone from '../models/Milestone.js';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import Announcement from '../models/Announcement.js';
import { notifyAnnouncement } from '../utils/notificationService.js';


// Get dashboard overview for HOD
export const getDashboardOverview = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalStaff = await Staff.countDocuments({ isActive: true });
    const pendingApprovals = await Project.countDocuments({ approvalStatus: 'Pending' });
    const approvedProjects = await Project.countDocuments({ approvalStatus: 'Approved' });
    const completedProjects = await Project.countDocuments({ status: 'Completed' });

    // Get projects by status
    const projectsByStatus = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent projects
    const recentProjects = await Project.find()
      .populate('studentId', 'name email studentId')
      .populate('assignedGuideId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      status: 'success',
      data: {
        totalProjects,
        totalStudents,
        totalStaff,
        pendingApprovals,
        approvedProjects,
        completedProjects,
        projectsByStatus,
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

// Get all project titles
export const getAllProjects = async (req, res) => {
  try {
    const { status, approvalStatus } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    const projects = await Project.find(filter)
      .populate('studentId', 'name email rollNumber department')
      .populate('assignedGuideId', 'name email employeeId')
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

// Approve final project
export const approveFinalProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { remarks } = req.body;

    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        status: 'Completed',
        approvalStatus: 'Approved',
        approvalRemarks: remarks,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('studentId', 'name email')
      .populate('assignedGuideId', 'name email');

    res.json({
      status: 'success',
      message: 'Final project approved successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Reject final project
export const rejectFinalProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { remarks } = req.body;

    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        status: 'Rejected',
        approvalStatus: 'Rejected',
        approvalRemarks: remarks,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('studentId', 'name email')
      .populate('assignedGuideId', 'name email');

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

// Assign guide to project
export const assignGuideToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { guideId } = req.body;

    // Verify guide exists and is a staff member
    const guide = await Staff.findById(guideId);
    if (!guide) {
      return res.status(404).json({
        status: 'error',
        message: 'Staff member not found'
      });
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      { assignedGuideId: guideId },
      { new: true }
    ).populate('studentId', 'name email rollNumber')
      .populate('assignedGuideId', 'name email employeeId');

    res.json({
      status: 'success',
      message: 'Guide assigned successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new staff member
export const createStaff = async (req, res) => {
  try {
    const { name, email, employeeId, password, department, phone } = req.body;

    // Check if staff already exists
    const existingStaff = await Staff.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingStaff) {
      return res.status(400).json({
        status: 'error',
        message: 'Staff member with this email or ID already exists'
      });
    }

    const staff = await Staff.create({
      name,
      email,
      employeeId,
      password,
      department,
      phone,
      isActive: true
    });

    // Remove password from response
    staff.password = undefined;

    res.status(201).json({
      status: 'success',
      message: 'Staff member created successfully',
      data: staff
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all staff members
export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true })
      .select('name email employeeId department phone isActive')
      .sort({ name: 1 });

    // Get project count for each staff
    const staffWithProjects = await Promise.all(
      staff.map(async (member) => {
        const projectCount = await Project.countDocuments({ assignedGuideId: member._id });
        return {
          ...member.toObject(),
          assignedProjects: projectCount
        };
      })
    );

    res.json({
      status: 'success',
      data: staffWithProjects
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .select('name email studentId department phone isActive')
      .sort({ studentId: 1 });

    // Get project info for each student
    const studentsWithProjects = await Promise.all(
      students.map(async (student) => {
        const project = await Project.findOne({ studentId: student._id })
          .populate('assignedGuideId', 'name email');
        return {
          ...student.toObject(),
          project: project || null
        };
      })
    );

    res.json({
      status: 'success',
      data: studentsWithProjects
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    // Projects by status
    const projectsByStatus = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Projects by approval status
    const projectsByApproval = await Project.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Documents by type
    const documentsByType = await Document.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Staff workload
    const staffWorkload = await Project.aggregate([
      {
        $match: { assignedGuideId: { $ne: null } }
      },
      {
        $group: {
          _id: '$assignedGuideId',
          projectCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      {
        $unwind: '$staff'
      },
      {
        $project: {
          name: '$staff.name',
          email: '$staff.email',
          projectCount: 1
        }
      },
      {
        $sort: { projectCount: -1 }
      }
    ]);

    res.json({
      status: 'success',
      data: {
        projectsByStatus,
        projectsByApproval,
        documentsByType,
        staffWorkload
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, targetAudience, deadline } = req.body;

    const announcement = new Announcement({
      title,
      message,
      type,
      targetAudience,
      deadline,
      createdBy: req.user._id,
      createdByUserModel: req.user.role
    });

    await announcement.save();

    // Fetch recipients based on target audience
    let recipients = [];
    if (targetAudience === 'Students' || targetAudience === 'All') {
      const students = await Student.find({ isActive: true }).select('name email');
      recipients = [...recipients, ...students];
    }
    if (targetAudience === 'Staff' || targetAudience === 'All') {
      const staff = await Staff.find({ isActive: true }).select('name email');
      recipients = [...recipients, ...staff];
    }

    await notifyAnnouncement(announcement, recipients);

    res.status(201).json({
      status: 'success',
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all announcements
export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update announcement
export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const updates = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      announcementId,
      updates,
      { new: true }
    ).populate('createdBy', 'name email');

    // Fetch recipients for update notification
    let recipients = [];
    if (announcement.targetAudience === 'Students' || announcement.targetAudience === 'All') {
      const students = await Student.find({ isActive: true }).select('name email');
      recipients = [...recipients, ...students];
    }
    if (announcement.targetAudience === 'Staff' || announcement.targetAudience === 'All') {
      const staff = await Staff.find({ isActive: true }).select('name email');
      recipients = [...recipients, ...staff];
    }

    await notifyAnnouncement(announcement, recipients, true);

    res.json({
      status: 'success',
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    await Announcement.findByIdAndUpdate(announcementId, { isActive: false });

    res.json({
      status: 'success',
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
