import express from 'express';
import * as staffController from '../controllers/staffController.js';
import * as studentMgmtController from '../controllers/studentManagementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to ensure user is Staff
const isStaff = (req, res, next) => {
  if (req.user.role !== 'Staff') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Staff only.'
    });
  }
  next();
};

// Dashboard overview
router.get('/dashboard/overview', protect, isStaff, staffController.getDashboardOverview);

// Students management
router.get('/students', protect, isStaff, staffController.getAssignedStudents);
router.post('/students', protect, isStaff, studentMgmtController.createStudent);
// router.get('/students/all', protect, isStaff, studentMgmtController.getAllStudents); // Blocked for staff
// router.get('/students/without-teams', protect, isStaff, studentMgmtController.getStudentsWithoutTeams); // Blocked for staff
router.put('/students/:studentId', protect, isStaff, studentMgmtController.updateStudent);
router.delete('/students/:studentId', protect, isStaff, studentMgmtController.deleteStudent);

// Team creation
router.post('/teams/create', protect, isStaff, studentMgmtController.createTeamWithStudents);

// Projects management
router.get('/projects', protect, isStaff, staffController.getStaffProjects);
router.post('/projects/:projectId/approve', protect, isStaff, staffController.approveProject);
router.post('/projects/:projectId/reject', protect, isStaff, staffController.rejectProject);
router.put('/projects/:projectId/status', protect, isStaff, staffController.updateProjectStatus);
router.post('/projects/:projectId/assign-guide', protect, isStaff, staffController.assignGuideToProject);

// Documents review
router.get('/documents', protect, isStaff, staffController.getDocumentsForReview);
router.post('/documents/:documentId/review', protect, isStaff, staffController.reviewDocument);

// Milestones/Tasks
router.post('/milestones', protect, isStaff, staffController.createMilestone);
router.get('/milestones/:studentId', protect, isStaff, staffController.getStudentMilestones);
router.put('/milestones/:milestoneId/status', protect, isStaff, staffController.updateMilestoneStatus);

export default router;
