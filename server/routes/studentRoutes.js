import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createProject, getMyProject } from '../controllers/studentProjectController.js';

const router = express.Router();

// Student project endpoints
router.post('/projects', protect, createProject);
router.get('/projects/my', protect, getMyProject);

export default router;
