import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createProject, getMyProject, updateMyProject, uploadDocument, getMyDocuments, getMyMilestones, submitProgress, updateMilestoneStatus } from '../controllers/studentProjectController.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads (same as in controller)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|zip|rar|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const router = express.Router();

// Student project endpoints
router.post('/projects', protect, createProject);
router.get('/projects/my', protect, getMyProject);
router.put('/projects/my', protect, updateMyProject);

// Student document endpoints
router.post('/documents', protect, upload.single('file'), uploadDocument);
router.get('/documents/my', protect, getMyDocuments);

// Student milestone endpoints
router.get('/milestones/my', protect, getMyMilestones);
router.put('/milestones/status', protect, updateMilestoneStatus);

// Student progress endpoints
router.post('/progress', protect, submitProgress);

export default router;
