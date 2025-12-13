import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import HOD from '../models/HOD.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { validationResult } from 'express-validator';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role, department, employeeId, studentId, phone } = req.body;

    // Determine which model to use based on role
    let UserModel;
    let checkDuplicateField = null;
    let duplicateFieldName = null;

    if (role === 'Student') {
      UserModel = Student;
      checkDuplicateField = { studentId };
      duplicateFieldName = 'studentId';
    } else if (role === 'Staff') {
      UserModel = Staff;
      checkDuplicateField = { employeeId };
      duplicateFieldName = 'employeeId';
    } else if (role === 'HOD') {
      UserModel = HOD;
      checkDuplicateField = { employeeId };
      duplicateFieldName = 'employeeId';
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be Student, Staff, or HOD'
      });
    }

    // Check if user already exists with same email
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: `User already exists with this email`
      });
    }

    // Check for duplicate ID
    if (checkDuplicateField) {
      const duplicateExists = await UserModel.findOne(checkDuplicateField);
      if (duplicateExists) {
        return res.status(400).json({
          status: 'error',
          message: `${duplicateFieldName} already exists`
        });
      }
    }

    // Create user based on role
    const userData = {
      name,
      email,
      password,
      department
    };

    if (role === 'Student') {
      userData.studentId = studentId;
    } else if (role === 'Staff' || role === 'HOD') {
      userData.employeeId = employeeId;
    }

    if (phone) userData.phone = phone;

    const user = await UserModel.create(userData);

    if (user) {
      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: role,
            department: user.department,
            employeeId: user.employeeId,
            studentId: user.studentId,
            phone: user.phone,
            isActive: user.isActive
          },
          token
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, role } = req.body;

    // Determine which model to use based on role
    let UserModel;
    if (role === 'Student') {
      UserModel = Student;
    } else if (role === 'Staff') {
      UserModel = Staff;
    } else if (role === 'HOD') {
      UserModel = HOD;
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be Student, Staff, or HOD'
      });
    }

    // Check if user exists (include password for comparison)
    const user = await UserModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: role,
          department: user.department,
          employeeId: user.employeeId,
          studentId: user.studentId,
          phone: user.phone,
          isActive: user.isActive
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    // User object in req.user is already populated by middleware
    // Just return the user data from req.user (which is set by protect middleware)
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Determine which model to use based on stored role
    let UserModel;
    if (userRole === 'Student') {
      UserModel = Student;
    } else if (userRole === 'Staff') {
      UserModel = Staff;
    } else if (userRole === 'HOD') {
      UserModel = HOD;
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update allowed fields
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.department = req.body.department || user.department;

    // Update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: userRole,
          department: updatedUser.department,
          employeeId: updatedUser.employeeId,
          studentId: updatedUser.studentId,
          phone: updatedUser.phone,
          isActive: updatedUser.isActive
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all users (Admin only - HOD)
// @route   GET /api/auth/users
// @access  Private/HOD
export const getAllUsers = async (req, res) => {
  try {
    // Get students, staff, and hods
    const students = await Student.find().select('-password');
    const staff = await Staff.find().select('-password');
    const hods = await HOD.find().select('-password');

    // Format all users with role field
    const users = [
      ...students.map(u => ({ ...u.toObject(), role: 'Student' })),
      ...staff.map(u => ({ ...u.toObject(), role: 'Staff' })),
      ...hods.map(u => ({ ...u.toObject(), role: 'HOD' }))
    ];

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
};
