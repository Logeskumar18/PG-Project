import express from 'express';
import * as staffController from '../controllers/staffController.js';
import * as studentMgmtController from '../controllers/studentManagementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { staffOwnsStudent } from '../middleware/ownershipMiddleware.js';

const router = express.Router();

/**
 * Staff role middleware
 */
const isStaff = (req, res, next) => {
  if (req.user.role !== 'Staff') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Staff only.'
    });
  }
  next();
};

/* ============================
   DASHBOARD
============================ */
router.get(
  '/dashboard/overview',
  protect,
  isStaff,
  staffController.getDashboardOverview
);

/* ============================
   STUDENT MANAGEMENT
============================ */
router.get(
  '/students',
  protect,
  isStaff,
  staffController.getAssignedStudents
);

router.post(
  '/students',
  protect,
  isStaff,
  studentMgmtController.createStudent
);

router.put(
  '/students/:studentId',
  protect,
  isStaff,
  staffOwnsStudent,
  studentMgmtController.updateStudent
);

router.delete(
  '/students/:studentId',
  protect,
  isStaff,
  staffOwnsStudent,
  studentMgmtController.deleteStudent
);

/* ============================
   TEAM MANAGEMENT
============================ */
router.post(
  '/teams/create',
  protect,
  isStaff,
  studentMgmtController.createTeamWithStudents
);

/* ============================
   PROJECT APPROVAL (FIXED ✅)
============================ */
router.get(
  '/projects',
  protect,
  isStaff,
  staffController.getStaffProjects
);

/**
 * ✅ APPROVE PROJECT
 * POST /api/staff/projects/:projectId/approve
 */
router.post(
  '/projects/:projectId/approve',
  protect,
  isStaff,
  staffController.approveProject
);

/**
 * ✅ REJECT PROJECT
 * POST /api/staff/projects/:projectId/reject
 */
router.post(
  '/projects/:projectId/reject',
  protect,
  isStaff,
  staffController.rejectProject
);

/**
 * Update project status (generic)
 */
router.put(
  '/projects/:projectId/status',
  protect,
  isStaff,
  staffController.updateProjectStatus
);

/**
 * Assign guide to project
 */
router.post(
  '/projects/:projectId/assign-guide',
  protect,
  isStaff,
  staffController.assignGuideToProject
);

/* ============================
   DOCUMENT REVIEW
============================ */
router.get(
  '/documents',
  protect,
  isStaff,
  staffController.getDocumentsForReview
);

router.post(
  '/documents/:documentId/review',
  protect,
  isStaff,
  staffController.reviewDocument
);

/* ============================
   MILESTONES / TASKS
============================ */
router.get(
  '/milestones',
  protect,
  isStaff,
  staffController.getStaffMilestones
);

router.post(
  '/milestones',
  protect,
  isStaff,
  staffController.createMilestone
);

router.get(
  '/milestones/:studentId',
  protect,
  isStaff,
  staffController.getStudentMilestones
);

router.put(
  '/milestones/:milestoneId/status',
  protect,
  isStaff,
  staffController.updateMilestoneStatus
);
router.put(
  '/projects/:projectId/edit',
  protect,
  isStaff,
  staffController.editProject
);

/* ============================
   PROGRESS
============================ */
router.get(
  '/progress',
  protect,
  isStaff,
  staffController.getStudentProgress
);


export default router;
