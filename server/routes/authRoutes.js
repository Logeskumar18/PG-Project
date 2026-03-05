import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['HOD', 'Staff', 'Student', 'Guide'])
    .withMessage('Role must be either HOD, Staff, Student, or Guide')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['Student', 'Staff', 'HOD', 'Guide'])
    .withMessage('Role must be Student, Staff, HOD, or Guide')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes (require authentication)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin routes (HOD only)
router.get('/users', protect, authorize('HOD'), getAllUsers);

export default router;
