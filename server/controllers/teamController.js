import Team from '../models/Team.js';
import Project from '../models/Project.js';
import Progress from '../models/Progress.js';
import Document from '../models/Document.js';
import { notifyProgressSubmission } from '../utils/notificationService.js';


// Create a new team
export const createTeam = async (req, res) => {
  try {
    const { name, projectId, members, guideId, description } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Create team
    const team = new Team({
      name,
      projectId,
      members,
      guideId,
      description
    });

    await team.save();

    // Update project with team reference if needed
    await Project.findByIdAndUpdate(projectId, {
      assignedGuideId: guideId
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('projectId', 'title description')
      .populate('members.studentId', 'name email rollNumber')
      .populate('guideId', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Team created successfully',
      data: populatedTeam
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all teams
export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('projectId', 'title description status')
      .populate('members.studentId', 'name email rollNumber')
      .populate('guideId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get team by ID
export const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate('projectId', 'title description status approvalStatus')
      .populate('members.studentId', 'name email rollNumber department')
      .populate('guideId', 'name email employeeId');

    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    // Get team progress
    const progressData = await Progress.find({ teamId })
      .populate('studentId', 'name')
      .sort({ weekNumber: -1 });

    // Get team documents
    const documents = await Document.find({ projectId: team.projectId })
      .populate('studentId', 'name')
      .sort({ uploadedAt: -1 });

    res.json({
      status: 'success',
      data: {
        team,
        progress: progressData,
        documents
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update team
export const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const updates = req.body;

    const team = await Team.findByIdAndUpdate(
      teamId,
      updates,
      { new: true }
    ).populate('projectId', 'title')
      .populate('members.studentId', 'name email')
      .populate('guideId', 'name email');

    res.json({
      status: 'success',
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add member to team
export const addTeamMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { studentId, role } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    // Check if student already in team
    const exists = team.members.some(m => m.studentId.toString() === studentId);
    if (exists) {
      return res.status(400).json({
        status: 'error',
        message: 'Student already in team'
      });
    }

    team.members.push({ studentId, role: role || 'Member' });
    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('members.studentId', 'name email rollNumber');

    res.json({
      status: 'success',
      message: 'Member added successfully',
      data: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Remove member from team
export const removeTeamMember = async (req, res) => {
  try {
    const { teamId, studentId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    team.members = team.members.filter(m => m.studentId.toString() !== studentId);
    await team.save();

    res.json({
      status: 'success',
      message: 'Member removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Link project to team
export const linkProjectToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { projectId } = req.body;

    const team = await Team.findByIdAndUpdate(
      teamId,
      { projectId },
      { new: true }
    ).populate('projectId', 'title description');

    res.json({
      status: 'success',
      message: 'Project linked to team successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Submit team progress
export const submitTeamProgress = async (req, res) => {
  try {
    const { teamId, projectId, weekNumber, progressPercentage, description, tasksCompleted, challenges, nextWeekPlan } = req.body;

    const progress = new Progress({
      teamId,
      projectId,
      studentId: req.user.id,
      weekNumber,
      progressPercentage,
      description,
      tasksCompleted,
      challenges,
      nextWeekPlan
    });

    await progress.save();

    // Update team overall progress (average of all progress entries)
    const allProgress = await Progress.find({ teamId });
    const avgProgress = allProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / allProgress.length;

    await Team.findByIdAndUpdate(teamId, {
      overallProgress: Math.round(avgProgress)
    });

    // Notify Guide
    const team = await Team.findById(teamId).populate('guideId');
    await notifyProgressSubmission(progress, team, 'Team');

    res.status(201).json({
      status: 'success',
      message: 'Progress submitted successfully',
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get team progress dashboard
export const getTeamProgressDashboard = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate('projectId', 'title description status approvalStatus')
      .populate('members.studentId', 'name email rollNumber')
      .populate('guideId', 'name email');

    if (!team) {
      return res.status(404).json({
        status: 'error',
        message: 'Team not found'
      });
    }

    // Get all progress entries
    const progressEntries = await Progress.find({ teamId })
      .populate('studentId', 'name email')
      .sort({ weekNumber: -1 });

    // Get progress by week
    const progressByWeek = await Progress.aggregate([
      { $match: { teamId: team._id } },
      {
        $group: {
          _id: '$weekNumber',
          avgProgress: { $avg: '$progressPercentage' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get documents
    const documents = await Document.find({ projectId: team.projectId })
      .populate('studentId', 'name')
      .sort({ uploadedAt: -1 });

    // Get milestones
    const milestones = await mongoose.model('Milestone').find({
      projectId: team.projectId
    }).sort({ dueDate: 1 });

    // Team statistics
    const stats = {
      totalMembers: team.members.length,
      overallProgress: team.overallProgress,
      totalDocuments: documents.length,
      pendingDocuments: documents.filter(d => d.reviewStatus === 'Pending').length,
      approvedDocuments: documents.filter(d => d.reviewStatus === 'Approved').length,
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.status === 'Completed').length
    };

    res.json({
      status: 'success',
      data: {
        team,
        progressEntries,
        progressByWeek,
        documents,
        milestones,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get teams by guide
export const getTeamsByGuide = async (req, res) => {
  try {
    const guideId = req.user.id;

    const teams = await Team.find({ guideId })
      .populate('projectId', 'title description status')
      .populate('members.studentId', 'name email rollNumber')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get teams by student
export const getTeamsByStudent = async (req, res) => {
  try {
    const studentId = req.user.id;

    const teams = await Team.find({
      'members.studentId': studentId
    })
      .populate('projectId', 'title description status')
      .populate('members.studentId', 'name email rollNumber')
      .populate('guideId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
