import Student from '../models/Student.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import { notifyTeamCreation } from '../utils/notificationService.js';

const isStudentAssignedToStaff = async (studentId, staffId) => {
  const project = await Project.findOne({ studentId, assignedGuideId: staffId }).lean();
  if (project) return true;
  // Also check if student was created by this staff
  const student = await Student.findById(studentId).select('createdByStaffId');
  return student?.createdByStaffId?.toString() === staffId.toString();
};
export const createStudent = async (req, res) => {
  try {
    const { name, email, password, studentId, department } = req.body;

    const studentExists = await Student.findOne({
      $or: [{ email }, { studentId }]
    });

    if (studentExists) {
      return res.status(400).json({
        message: 'Student with this email or student ID already exists'
      });
    }

    // ✅ ALWAYS set staff ID
    const student = await Student.create({
      name,
      email,
      password,
      studentId,
      department: department || req.user.department,
      createdByStaffId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        department: student.department
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error creating student',
      error: error.message
    });
  }
};

// Create team with students
export const createTeamWithStudents = async (req, res) => {
  try {
    const { teamName, projectTitle, projectDescription, memberIds, leaderId } = req.body;
    const guideId = req.user._id;

    // Validate that all members exist and are students
    const students = await User.find({ 
      _id: { $in: memberIds }, 
      role: 'Student' 
    });

    if (students.length !== memberIds.length) {
      return res.status(400).json({ 
        message: 'One or more invalid student IDs' 
      });
    }

    // Validate leader is in the member list
    if (!memberIds.includes(leaderId)) {
      return res.status(400).json({ 
        message: 'Team leader must be one of the team members' 
      });
    }

    // Create project for the team
    const project = await Project.create({
      studentId: leaderId, // Assign to team leader
      assignedGuideId: guideId,
      title: projectTitle,
      description: projectDescription,
      status: 'Planning',
      approvalStatus: 'Pending'
    });

    // Build members array with roles
    const members = memberIds.map(memberId => ({
      studentId: memberId,
      role: memberId.toString() === leaderId.toString() ? 'Leader' : 'Member'
    }));

    // Create team
    const team = await Team.create({
      name: teamName,
      projectId: project._id,
      members,
      guideId,
      overallProgress: 0,
      status: 'Active'
    });

    // Populate team data
    const populatedTeam = await Team.findById(team._id)
      .populate('members.studentId', 'name email studentId')
      .populate('projectId', 'title description status')
      .populate('guideId', 'name email');

    // Send notifications to all team members
    await notifyTeamCreation(team, memberIds);

    res.status(201).json({
      success: true,
      message: 'Team and project created successfully',
      data: {
        team: populatedTeam,
        project
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating team', 
      error: error.message 
    });
  }
};

// Get all students (for team creation dropdown)
export const getAllStudents = async (req, res) => {
  try {
    if (req.user.role === 'Staff') {
      return res.status(403).json({
        message: 'Staff cannot list all students.'
      });
    }
    const { department } = req.query;
    
    const query = {};
    if (department) {
      query.department = department;
    }

    const students = await Student.find(query)
      .select('name email studentId department')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: students,
      total: students.length
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching students', 
      error: error.message 
    });
  }
};

// Get students without teams
export const getStudentsWithoutTeams = async (req, res) => {
  try {
    if (req.user.role === 'Staff') {
      return res.status(403).json({
        message: 'Staff cannot list students outside their assigned teams.'
      });
    }
    // Get all student IDs who are already in teams
    const teamsWithMembers = await Team.find({}, 'members');
    const studentIdsInTeams = teamsWithMembers.flatMap(team => 
      team.members.map(member => member.studentId.toString())
    );

    // Find students not in any team
    const studentsWithoutTeams = await Student.find({
      _id: { $nin: studentIdsInTeams }
    }).select('name email studentId department').sort({ name: 1 });

    res.json({
      success: true,
      data: studentsWithoutTeams,
      total: studentsWithoutTeams.length
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching students', 
      error: error.message 
    });
  }
};

// Update student details
export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const updates = req.body;

    if (req.user.role === 'Staff') {
      const allowed = await isStudentAssignedToStaff(studentId, req.user._id);
      if (!allowed) {
        return res.status(403).json({ message: 'You can only update students assigned to you.' });
      }
    }

    // Don't allow password updates through this endpoint
    delete updates.password;

    const student = await Student.findByIdAndUpdate(
      studentId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating student', 
      error: error.message 
    });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'Staff') {
      const allowed = await isStudentAssignedToStaff(studentId, req.user._id);
      if (!allowed) {
        return res.status(403).json({ message: 'You can only delete students assigned to you.' });
      }
    }

    // Check if student is in any team
    const teamWithStudent = await Team.findOne({
      'members.studentId': studentId
    });

    if (teamWithStudent) {
      return res.status(400).json({ 
        message: 'Cannot delete student who is part of a team. Remove from team first.' 
      });
    }

    const student = await Student.findByIdAndDelete(studentId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting student', 
      error: error.message 
    });
  }
};

export default {
  createStudent,
  createTeamWithStudents,
  getAllStudents,
  getStudentsWithoutTeams,
  updateStudent,
  deleteStudent
};
