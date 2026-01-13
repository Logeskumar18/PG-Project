import Project from '../models/Project.js';
import Document from '../models/Document.js';
import Milestone from '../models/Milestone.js';
import Progress from '../models/Progress.js';
import Staff from '../models/Staff.js';
import Team from '../models/Team.js';
import { notifyProjectApproval, notifyProjectRejection, notifyDocumentReview, notifyProgressReview, createNotification } from '../utils/notificationService.js';
import { sendMail } from '../utils/mailer.js';

// Get assigned students (ownership-based)
import Student from '../models/Student.js';

// Get assigned students (ownership-based + project-assigned)
export const getAssignedStudents = async (req, res) => {
  try {
    const staffId = req.user._id;
    console.log('DEBUG: getAssignedStudents - staffId:', staffId);

    // 1. Find students created by this staff
    const createdStudents = await Student.find({ createdByStaffId: staffId }).select('_id');
    const createdStudentIds = createdStudents.map(s => s._id.toString());

    // 2. Find students assigned to this staff via Projects
    const assignedProjects = await Project.find({ assignedGuideId: staffId })
      .select('studentId students teamId');

    let projectStudentIds = [];
    assignedProjects.forEach(p => {
      // Solo project
      if (p.studentId) projectStudentIds.push(p.studentId.toString());
      // Team project direct refs
      if (p.students && p.students.length > 0) {
        p.students.forEach(sId => projectStudentIds.push(sId.toString()));
      }
    });

    // 3. For teams, we might need to fetch team members if not in project.students
    // But usually project.students should be populated. If not, we might miss some.
    // Assuming project.students is kept in sync or we rely on solo studentId for now.
    // (Project model has students array for teams).

    // Combine IDs
    const allStudentIds = [...new Set([...createdStudentIds, ...projectStudentIds])];

    // Fetch details
    const students = await Student.find({ _id: { $in: allStudentIds } })
      .select('name email studentId department createdByStaffId');

    // For each student, find their project count
    const studentsWithProjects = await Promise.all(students.map(async (student) => {
      const projectCount = await Project.countDocuments({
        studentId: student._id
      });
      return {
        ...student.toObject(),
        userId: student._id,
        projectCount
      };
    }));

    res.json({
      status: 'success',
      data: {
        students: studentsWithProjects,
        totalStudents: studentsWithProjects.length
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
    const staffId = req.user._id;
    console.log('DEBUG: getStaffProjects - staffId:', staffId);

    const projects = await Project.find({ assignedGuideId: staffId })
      .populate('studentId', 'name studentId')
      .sort({ createdAt: -1 });

    console.log('DEBUG: getStaffProjects - projects found:', projects.length);
    console.log('DEBUG: getStaffProjects - query:', { assignedGuideId: staffId });

    res.json({
      status: 'success',
      data: projects
    });
  } catch (error) {
    console.error('DEBUG: getStaffProjects error:', error);
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

    const projectOwned = await Project.findOne({ _id: projectId, assignedGuideId: req.user._id });
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

    // Send Email to Student
    if (project.studentId && project.studentId.email) {
      await sendMail({
        to: project.studentId.email,
        subject: `✅ Project Approved: ${project.title}`,

        text: `Dear ${project.studentId.name},

Your project "${project.title}" has been approved by your guide ${req.user.name}.

Remarks:
${remarks || 'None'}

You may now proceed with the next phase of your project.

Regards,
Project Portal`,

        html: `
    <div style="background-color:#f4f6f8; padding:30px; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background:#10b981; padding:20px; text-align:center; color:#ffffff;">
          <h2 style="margin:0; font-size:22px;">Project Approved</h2>
          <p style="margin:6px 0 0; font-size:14px;">
            Congratulations 🎉
          </p>
        </div>

        <!-- Body -->
        <div style="padding:25px;">
          <p style="font-size:15px; color:#333;">
            Dear <strong>${project.studentId.name}</strong>,
          </p>

          <p style="font-size:14px; color:#555; line-height:1.6;">
            Your project has been reviewed and 
            <strong style="color:#10b981;">approved</strong>
            by your guide <strong>${req.user.name}</strong>.
          </p>

          <!-- Project Info -->
          <div style="margin:20px 0; border:1px solid #d1fae5; border-radius:6px; overflow:hidden;">
            <div style="background:#ecfdf5; padding:12px 15px; font-weight:bold; color:#065f46;">
              Approval Details
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:10px 15px; border-top:1px solid #d1fae5;"><strong>Project Title</strong></td>
                <td style="padding:10px 15px; border-top:1px solid #d1fae5;">
                  ${project.title}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 15px; border-top:1px solid #d1fae5;"><strong>Guide</strong></td>
                <td style="padding:10px 15px; border-top:1px solid #d1fae5;">
                  ${req.user.name}
                </td>
              </tr>
            </table>
          </div>

          <!-- Remarks -->
          <div style="background:#f0fdf4; border-left:4px solid #22c55e; padding:15px; border-radius:4px;">
            <p style="margin:0 0 6px; font-size:14px; font-weight:bold; color:#065f46;">
              Remarks
            </p>
            <p style="margin:0; font-size:14px; color:#065f46; line-height:1.6;">
              ${remarks || 'No remarks provided.'}
            </p>
          </div>

          <p style="font-size:14px; color:#555; margin-top:20px;">
            You may now proceed with the next phase of your project. 
            If you have any questions, feel free to contact your guide.
          </p>

          <p style="margin-top:30px; font-size:14px; color:#333;">
            Regards,<br>
            <strong>Project Portal Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb; padding:14px; text-align:center; font-size:12px; color:#6b7280;">
          © ${new Date().getFullYear()} Project Portal. All rights reserved.
        </div>

      </div>
    </div>
  `
      });

    }

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

    const projectOwned = await Project.findOne({ _id: projectId, assignedGuideId: req.user._id });
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

    // Send Email to Student
    if (project.studentId && project.studentId.email) {
      await sendMail({
        to: project.studentId.email,
        subject: `❌ Project Rejected: ${project.title}`,

        text: `Dear ${project.studentId.name},

Your project "${project.title}" has been rejected by your guide ${req.user.name}.

Remarks:
${remarks}

Please review the remarks and resubmit your project.

Regards,
Project Portal`,

        html: `
    <div style="background-color:#f4f6f8; padding:30px; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background:#ef4444; padding:20px; text-align:center; color:#ffffff;">
          <h2 style="margin:0; font-size:22px;">Project Rejected</h2>
          <p style="margin:6px 0 0; font-size:14px;">
            Action Required
          </p>
        </div>

        <!-- Body -->
        <div style="padding:25px;">
          <p style="font-size:15px; color:#333;">
            Dear <strong>${project.studentId.name}</strong>,
          </p>

          <p style="font-size:14px; color:#555; line-height:1.6;">
            Your project has been reviewed and <strong style="color:#ef4444;">rejected</strong>
            by your guide <strong>${req.user.name}</strong>.
          </p>

          <!-- Project Info -->
          <div style="margin:20px 0; border:1px solid #fee2e2; border-radius:6px; overflow:hidden;">
            <div style="background:#fef2f2; padding:12px 15px; font-weight:bold; color:#991b1b;">
              Review Details
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:10px 15px; border-top:1px solid #fee2e2;"><strong>Project Title</strong></td>
                <td style="padding:10px 15px; border-top:1px solid #fee2e2;">
                  ${project.title}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 15px; border-top:1px solid #fee2e2;"><strong>Guide</strong></td>
                <td style="padding:10px 15px; border-top:1px solid #fee2e2;">
                  ${req.user.name}
                </td>
              </tr>
            </table>
          </div>

          <!-- Remarks -->
          <div style="background:#fff7ed; border-left:4px solid #f97316; padding:15px; border-radius:4px;">
            <p style="margin:0 0 6px; font-size:14px; font-weight:bold; color:#7c2d12;">
              Remarks
            </p>
            <p style="margin:0; font-size:14px; color:#7c2d12; line-height:1.6;">
              ${remarks}
            </p>
          </div>

          <p style="font-size:14px; color:#555; margin-top:20px;">
            Please correct the issues mentioned above and resubmit your project
            through the Project Portal.
          </p>

          <p style="margin-top:30px; font-size:14px; color:#333;">
            Regards,<br>
            <strong>Project Portal Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb; padding:14px; text-align:center; font-size:12px; color:#6b7280;">
          © ${new Date().getFullYear()} Project Portal. All rights reserved.
        </div>

      </div>
    </div>
  `
      });

    }

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
// ================= EDIT PROJECT =================
export const editProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description } = req.body;

    // Ensure staff owns this project
    const project = await Project.findOne({
      _id: projectId,
      assignedGuideId: req.user._id
    });

    if (!project) {
      return res.status(403).json({
        status: 'error',
        message: 'Project not found or not assigned to you'
      });
    }

    // Update ONLY editable fields
    project.title = title;
    project.description = description;

    // Reset approval if edited
    project.approvalStatus = 'Pending';
    project.status = 'Submitted';

    await project.save();

    res.json({
      status: 'success',
      message: 'Project updated successfully',
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
    const staffId = req.user._id;

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

    // Validate review status
    const validStatuses = ['Approved', 'Rejected', 'Action Needed', 'Needs Review'];
    if (reviewStatus && !validStatuses.includes(reviewStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be Approved, Rejected, Action Needed, or Needs Review'
      });
    }

    // Require remarks for negative statuses
    if ((reviewStatus === 'Rejected' || reviewStatus === 'Action Needed' || reviewStatus === 'Needs Review') && !remarks) {
      return res.status(400).json({
        status: 'error',
        message: 'Remarks are required when rejecting or requesting action'
      });
    }

    const document = await Document.findById(documentId).populate('projectId', 'assignedGuideId title').populate('studentId', 'name email');
    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    if (!document.projectId) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found for this document'
      });
    }

    if (!document.projectId.assignedGuideId || document.projectId.assignedGuideId.toString() !== req.user._id.toString()) {
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
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('studentId', 'name email')
      .populate('projectId', 'title');

    // Notify student about document review
    await notifyDocumentReview(updated, req.user.name, reviewStatus);

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
}; import mongoose from "mongoose";

// Create milestone/task
export const createMilestone = async (req, res) => {
  try {
    const { studentId, title, description, dueDate, priority } = req.body;

    if (!studentId || !title) {
      return res.status(400).json({
        status: "error",
        message: "Required fields missing"
      });
    }

    // Ensure ObjectId conversion
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    // Find the project for this student assigned to the staff
    let project;
    const soloProject = await Project.findOne({
      studentId: studentObjectId,
      assignedGuideId: req.user._id
    });
    if (soloProject) {
      project = soloProject;
    } else {
      // Check team projects
      const teamProjects = await Project.find({
        teamId: { $exists: true },
        assignedGuideId: req.user._id
      });
      for (const p of teamProjects) {
        const team = await Team.findById(p.teamId);
        if (team && team.members.some(member => member.studentId.toString() === studentObjectId.toString())) {
          project = p;
          break;
        }
      }
    }

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found for this student"
      });
    }

    // Student belongs is already checked above, so no need for further check

    // Create milestone
    const milestone = await Milestone.create({
      projectId: project._id,
      studentId: studentObjectId,
      assignedBy: req.user._id,
      title,
      description,
      dueDate,
      priority
    });

    // Populate student name
    await milestone.populate('studentId', 'name');

    // Notify student
    await createNotification({
      userId: studentObjectId,
      type: "MILESTONE_ASSIGNED",
      title: "New Milestone Assigned",
      message: `A new milestone "${title}" has been assigned to your project.`,
      relatedTo: {
        type: "Milestone",
        referenceId: milestone._id
      },
      priority: "Medium"
    });

    return res.status(201).json({
      status: "success",
      message: "Milestone created successfully",
      data: milestone
    });

  } catch (error) {
    console.error("Create Milestone Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};

// Get milestones for a student
export const getStudentMilestones = async (req, res) => {
  try {
    const { studentId } = req.params;
    const projectIds = await Project.find({ assignedGuideId: req.user._id }).distinct('_id');

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

    const projectIds = await Project.find({ assignedGuideId: req.user._id }).distinct('_id');

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
      { _id: projectId, assignedGuideId: req.user._id },
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
    const staffId = req.user._id;

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
      .populate('studentId', 'name studentId')
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

// Get progress updates for assigned students
export const getStudentProgress = async (req, res) => {
  try {
    const staffId = req.user._id;

    // Find students assigned to this staff
    const students = await Student.find({ createdByStaffId: staffId }).select('_id');
    const studentIds = students.map(s => s._id);

    // Find projects assigned to this staff
    const projects = await Project.find({ assignedGuideId: staffId }).select('_id');
    const projectIds = projects.map(p => p._id);

    // Get progress updates for these projects and students
    const progressUpdates = await Progress.find({
      $or: [
        { projectId: { $in: projectIds } },
        { studentId: { $in: studentIds } }
      ]
    })
      .populate('projectId', 'title')
      .populate('studentId', 'name studentId')
      .sort({ submittedAt: -1 });

    res.json({
      status: 'success',
      data: progressUpdates
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Review Progress
export const reviewProgress = async (req, res) => {
  try {
    const { progressId } = req.params;
    const { status, feedback } = req.body;

    if (!['Satisfactory', 'Not Satisfactory'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }

    const progress = await Progress.findByIdAndUpdate(
      progressId,
      {
        status,
        feedback,
        reviewedBy: req.user._id
      },
      { new: true }
    ).populate('studentId', 'name email');

    if (!progress) {
      return res.status(404).json({ status: 'error', message: 'Progress not found' });
    }

    await notifyProgressReview(progress, req.user.name);

    res.json({ status: 'success', data: progress });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getStaffMilestones = async (req, res) => {
  try {
    const staffId = req.user._id;

    // Get all projects assigned to this staff
    const projects = await Project.find({ assignedGuideId: staffId }).select('_id');
    const projectIds = projects.map(p => p._id);

    const milestones = await Milestone.find({ projectId: { $in: projectIds } })
      .populate('studentId', 'name')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });

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
