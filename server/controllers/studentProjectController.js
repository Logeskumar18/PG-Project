import Project from '../models/Project.js';
import Team from '../models/Team.js';

// Student creates a project
export const createProject = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { title, description } = req.body;

    // Check if student already has a project
    const existing = await Project.findOne({ studentId });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a project.' });
    }


    // Try to find the student's team and assign the guide
    let assignedGuideId = null;
    const team = await Team.findOne({ 'members.studentId': studentId });
    if (team && team.guideId) {
      assignedGuideId = team.guideId;
    }

    const project = await Project.create({
      studentId,
      assignedGuideId,
      title,
      description,
      status: 'Submitted',
      approvalStatus: 'Pending',
      submittedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting project', error: error.message });
  }
};

// Student fetches their own project
export const getMyProject = async (req, res) => {
  try {
    const studentId = req.user._id;
    const project = await Project.findOne({ studentId });
    if (!project) {
      return res.status(404).json({ message: 'No project found' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};
