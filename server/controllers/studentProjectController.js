// Student updates their own project
export const updateMyProject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, description } = req.body;

    const student = await Student.findOne({ email: req.user.email });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const project = await Project.findOneAndUpdate(
      { studentId: student._id },
      { title, description },
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ message: 'No project found to update' });
    }
    res.json({ success: true, message: 'Project updated', data: project });
  } catch (error) {
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};
import Project from '../models/Project.js';
import Team from '../models/Team.js';
import Student from '../models/Student.js';
import Document from '../models/Document.js';
import Milestone from '../models/Milestone.js';
import Progress from '../models/Progress.js';
import multer from 'multer';
import path from 'path';
import { createNotification, notifyDocumentSubmission } from '../utils/notificationService.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|zip|rar|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Student creates a project
export const createProject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, description } = req.body;

    // Find the student profile
    const student = await Student.findOne({ email: req.user.email });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Allow multiple project submissions until one is approved

    // Try to find the student's team and assign the guide
    let assignedGuideId = null;
    const team = await Team.findOne({ 'members.studentId': userId });
    if (team && team.guideId) {
      assignedGuideId = team.guideId;
    }

    // If no guide from team, assign the staff who created the student
    if (!assignedGuideId) {
      if (student.createdByStaffId) {
        assignedGuideId = student.createdByStaffId;
      }
    }

    const project = await Project.create({
      studentId: student._id,
      assignedGuideId,
      title,
      description,
      status: 'Submitted',
      approvalStatus: 'Pending',
      submittedAt: new Date()
    });

    // Notify the assigned guide
    if (assignedGuideId) {
      await createNotification({
        userId: assignedGuideId,
        type: 'PROJECT_SUBMITTED',
        title: 'New Project Submitted',
        message: `A mapped student submitted project: ${title}`,
        relatedTo: { type: 'Project', referenceId: project._id },
        priority: 'High',
        actionUrl: `/dashboard/staff?tab=approvals`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting project', error: error.message });
  }
};

// Student fetches their own projects
export const getMyProject = async (req, res) => {
  try {
    const userId = req.user._id;
    const student = await Student.findOne({ email: req.user.email });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const projects = await Project.find({ studentId: student._id }).sort({ createdAt: -1 });
    if (projects.length === 0) {
      return res.status(404).json({ message: 'No projects found' });
    }
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

// Student uploads a document for their project
export const uploadDocument = async (req, res) => {
  try {
    const userId = req.user._id;
    const { docType, comments } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find the student profile
    const student = await Student.findOne({ email: req.user.email });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Find the student's latest project (any status)
    const project = await Project.findOne({ studentId: userId }).sort({ createdAt: -1 });

    if (!project) {
      return res.status(404).json({ message: 'No project found. Please submit a project first.' });
    }

    const document = await Document.create({
      projectId: project._id,
      studentId: student._id,
      type: docType,
      fileName: file.originalname,
      filePath: file.path,
      comments: comments || ''
    });

    // Notify the assigned guide or staff
    let notifyStaffId = project.assignedGuideId;
    if (!notifyStaffId) {
      if (student.createdByStaffId) {
        notifyStaffId = student.createdByStaffId;
      }
    }
    if (notifyStaffId) {
      await notifyDocumentSubmission(document, req.user.name || 'A student');
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
};

// Student fetches their uploaded documents
export const getMyDocuments = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Find student's projects first
    const projects = await Project.find({ studentId }).select('_id');
    const projectIds = projects.map(p => p._id);
    
    const documents = await Document.find({ 
      projectId: { $in: projectIds },
      studentId 
    }).populate('projectId', 'title').sort({ uploadedAt: -1 });

    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

// Get milestones for the student's projects
export const getMyMilestones = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Find student's projects: solo projects where studentId matches, or team projects where student is a member
    const soloProjects = await Project.find({ studentId }).select('_id');
    const teamProjects = await Project.find({ teamId: { $exists: true } })
      .populate({
        path: 'teamId',
        match: { 'members.studentId': studentId },
        select: '_id'
      })
      .select('_id teamId');
    
    const allProjects = [...soloProjects, ...teamProjects.filter(p => p.teamId)]; // filter out where populate failed
    const projectIds = allProjects.map(p => p._id);
    
    const milestones = await Milestone.find({ 
      projectId: { $in: projectIds },
      studentId 
    }).populate('projectId', 'title').populate('assignedBy', 'name').sort({ dueDate: 1 });

    res.json({ success: true, data: milestones });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching milestones', error: error.message });
  }
};

// Student submits progress update
export const submitProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { projectId, weekNumber, progressPercentage, description, tasksCompleted, challenges, nextWeekPlan } = req.body;

    // Verify the project belongs to the student
    const project = await Project.findOne({ _id: projectId, studentId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    const progress = await Progress.create({
      projectId,
      studentId,
      weekNumber,
      progressPercentage,
      description,
      tasksCompleted,
      challenges,
      nextWeekPlan
    });

    // Notify the assigned guide
    if (project.assignedGuideId) {
      await createNotification({
        userId: project.assignedGuideId,
        type: 'PROGRESS_SUBMITTED',
        title: 'Progress Update Submitted',
        message: `Student submitted progress update for project: ${project.title}`,
        relatedTo: { type: 'Progress', referenceId: progress._id },
        priority: 'Medium',
        actionUrl: `/dashboard/staff?tab=progress`
      });
    }

    res.json({ success: true, message: 'Progress submitted successfully', data: progress });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting progress', error: error.message });
  }
};

// Student updates milestone status
export const updateMilestoneStatus = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { milestoneId, status } = req.body;

    // Find the milestone and ensure it belongs to the student
    const milestone = await Milestone.findOne({ _id: milestoneId, studentId });
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found or access denied' });
    }

    milestone.status = status;
    await milestone.save();

    // Notify the assigned staff
    if (milestone.assignedBy) {
      await createNotification({
        userId: milestone.assignedBy,
        type: 'MILESTONE_UPDATED',
        title: 'Milestone Status Updated',
        message: `Student updated milestone status to ${status} for: ${milestone.title}`,
        relatedTo: { type: 'Milestone', referenceId: milestone._id },
        priority: 'Medium',
        actionUrl: `/dashboard/staff?tab=milestones`
      });
    }

    res.json({ success: true, message: 'Milestone status updated', data: milestone });
  } catch (error) {
    res.status(500).json({ message: 'Error updating milestone status', error: error.message });
  }
};
