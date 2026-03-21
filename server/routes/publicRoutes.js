import express from 'express';
import { getPublicShowcase } from '../controllers/projectController.js';

const router = express.Router();

// Public endpoint for highest graded projects showcase
router.get('/showcase', getPublicShowcase);

export default router;
