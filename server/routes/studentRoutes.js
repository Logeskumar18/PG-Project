import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createProject, getMyProject, updateMyProject, uploadDocument, getMyDocuments, getMyMilestones, submitProgress, updateMilestoneStatus, downloadDocument, upload as memoryUpload } from '../controllers/studentProjectController.js';


const router = express.Router();

// Student project endpoints
router.post('/projects', protect, createProject);
router.get('/projects/my', protect, getMyProject);
router.put('/projects/my', protect, updateMyProject);

// Student document endpoints
router.post('/documents', protect, memoryUpload.single('file'), uploadDocument);
router.get('/documents/my', protect, getMyDocuments);
// Download document by ID (admin/guide access)
router.get('/documents/:documentId/download', protect, downloadDocument);

// Student milestone endpoints
router.get('/milestones/my', protect, getMyMilestones);
router.put('/milestones/status', protect, updateMilestoneStatus);

// Student progress endpoints
router.post('/progress', protect, submitProgress);

export default router;
