import express from 'express';
import * as hodController from '../controllers/hodController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to ensure user is HOD
const isHOD = (req, res, next) => {
  if (req.user.role !== 'HOD') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. HOD only.'
    });
  }
  next();
};

// Dashboard overview
router.get('/dashboard/overview', protect, isHOD, hodController.getDashboardOverview);

// Analytics
router.get('/analytics', protect, isHOD, hodController.getAnalytics);

// Projects management
router.get('/projects', protect, isHOD, hodController.getAllProjects);
router.post('/projects/:projectId/approve-final', protect, isHOD, hodController.approveFinalProject);
router.post('/projects/:projectId/reject-final', protect, isHOD, hodController.rejectFinalProject);
router.post('/projects/:projectId/assign-guide', protect, isHOD, hodController.assignGuideToProject);

// Staff and Students
router.get('/staff', protect, isHOD, hodController.getAllStaff);
router.get('/students', protect, isHOD, hodController.getAllStudents);

// Announcements
router.post('/announcements', protect, isHOD, hodController.createAnnouncement);
router.get('/announcements', protect, isHOD, hodController.getAllAnnouncements);
router.put('/announcements/:announcementId', protect, isHOD, hodController.updateAnnouncement);
router.delete('/announcements/:announcementId', protect, isHOD, hodController.deleteAnnouncement);

export default router;
