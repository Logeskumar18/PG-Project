
import { downloadDocument as staffDownloadDocument } from '../controllers/studentProjectController.js';
import express from 'express';
import * as staffController from '../controllers/staffController.js';
import * as studentMgmtController from '../controllers/studentManagementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { staffOwnsStudent } from '../middleware/ownershipMiddleware.js';

// Staff role middleware (must be defined before use)
const isStaff = (req, res, next) => {
  if (req.user.role !== 'Staff') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Staff only.'
    });
  }
  next();
};

const router = express.Router();

// Document download by ID (publicly accessible via unguessable document ID since <a> tags can't send auth headers)
router.get('/documents/:documentId/download', staffDownloadDocument);

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

router.post(
  '/progress/:progressId/review',
  protect,
  isStaff,
  staffController.reviewProgress
);

router.post(
  '/assign-marks',
  protect,
  isStaff,
  staffController.assignMarks
);

/* ============================
   MEETINGS
============================ */
router.get(
  '/meetings',
  protect,
  isStaff,
  staffController.getGuideMeetings
);

router.put(
  '/meetings/:meetingId/status',
  protect,
  isStaff,
  staffController.updateMeetingStatus
);

export default router;
