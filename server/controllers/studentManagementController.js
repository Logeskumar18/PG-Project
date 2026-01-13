import Student from '../models/Student.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import { notifyTeamCreation } from '../utils/notificationService.js';
import { sendMail } from '../utils/mailer.js';

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


    // Send acknowledgement email
    try {
      console.log(`Attempting to send welcome email to ${student.email}...`);

      await sendMail({
        to: student.email,
        subject: 'Welcome to the Project Portal – Account Created',

        text: `Dear ${student.name},

Your student account has been created by your staff/guide.

Student ID: ${student.studentId}
Email: ${student.email}
Department: ${student.department}
Guide / Staff: ${req.user.name}
Password: ${password}

Please change your password after first login.

Best regards,
Project Portal Team`,

        html: `
      <div style="background-color:#f4f6f8; padding:30px; font-family:Arial, Helvetica, sans-serif;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background:#4f46e5; padding:20px; text-align:center; color:#ffffff;">
            <h1 style="margin:0; font-size:24px;">Project Portal</h1>
            <p style="margin:5px 0 0; font-size:14px;">Student Account Created</p>
          </div>

          <!-- Body -->
          <div style="padding:25px;">
            <p style="font-size:15px; color:#333;">
              Dear <strong>${student.name}</strong>,
            </p>

            <p style="font-size:14px; color:#555; line-height:1.6;">
              Your student account has been successfully created by your staff guide.
              You can now log in to the Project Portal using the credentials below.
            </p>

            <!-- Credentials Box -->
            <div style="margin:20px 0; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden;">
              <div style="background:#f9fafb; padding:12px 15px; font-weight:bold; color:#111;">
                Login Credentials
              </div>

              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb;"><strong>Student ID</strong></td>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb;">${student.studentId}</td>
                </tr>
                <tr>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb;"><strong>Email</strong></td>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb;">${student.email}</td>
                </tr>
                <tr>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb;"><strong>Department</strong></td>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb;">${student.department}</td>
                </tr>
                <tr>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb;"><strong>Guide / Staff</strong></td>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb;">
                    ${req.user.name}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb;"><strong>Password</strong></td>
                  <td style="padding:10px 15px; border-top:1px solid #e5e7eb; color:#dc2626; font-weight:bold;">
                    ${password}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Security Notice -->
            <div style="background:#fff7ed; border-left:4px solid #f97316; padding:12px; font-size:13px; color:#7c2d12;">
              ⚠️ For security reasons, please change your password immediately after your first login.
            </div>

            <p style="font-size:14px; color:#555; margin-top:20px;">
              If you face any issues while logging in, please contact your guide 
              <strong>${req.user.name}</strong>.
            </p>

            <p style="margin-top:30px; font-size:14px; color:#333;">
              Best regards,<br>
              <strong>Project Portal Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f9fafb; padding:15px; text-align:center; font-size:12px; color:#6b7280;">
            © ${new Date().getFullYear()} Project Portal. All rights reserved.
          </div>

        </div>
      </div>
    `
      });
    } catch (mailErr) {
      // Log but do not block creation
      console.error('Failed to send student creation email:', mailErr);
    }

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
