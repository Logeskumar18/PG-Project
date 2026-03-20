import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import HOD from '../models/HOD.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { validationResult } from 'express-validator';
import { notifyLogin, notifyPasswordChange } from '../utils/notificationService.js';
import jwt from 'jsonwebtoken';
import { sendMail } from '../utils/mailer.js';
import crypto from 'crypto';

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

    let { name, email, password, role, department, employeeId, studentId, phone } = req.body;
    // Map 'Guide' to 'Staff' internally
    if (role === 'Guide') role = 'Staff';

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
        message: 'Invalid role. Must be Student, Staff, HOD, or Guide'
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
            role: req.body.role, // Return the originally requested role for clarity
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

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    let UserModel;
    if (role === 'Student') {
      UserModel = Student;
    } else if (role === 'Staff' || role === 'Guide') {
      UserModel = Staff;
    } else if (role === 'HOD') {
      UserModel = HOD;
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid role.' });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      // For security, don't reveal if user exists
      return res.status(200).json({ status: 'success', message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate reset token (JWT)
    const resetToken = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Optionally, store hashed token and expiry in DB for extra security
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&role=${role}`;
    await sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request this, ignore this email.</p>`
    });

    res.status(200).json({ status: 'success', message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password, role } = req.body;
    if (!token || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields.' });
    }

    let UserModel;
    if (role === 'Student') {
      UserModel = Student;
    } else if (role === 'Staff' || role === 'Guide') {
      UserModel = Staff;
    } else if (role === 'HOD') {
      UserModel = HOD;
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid role.' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired token.' });
    }

    // Find user and check token/expiry
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserModel.findOne({ _id: decoded.id, resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired token.' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await notifyPasswordChange(user);

    res.status(200).json({ status: 'success', message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password-otp
// @access  Public
export const forgotPasswordOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    let UserModel;
    if (role === 'Student') {
      UserModel = Student;
    } else if (role === 'Staff' || role === 'Guide') {
      UserModel = Staff;
    } else if (role === 'HOD') {
      UserModel = HOD;
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid role.' });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      // For security, don't reveal if user exists
      return res.status(200).json({ status: 'success', message: 'If an account with that email exists, an OTP has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store hashed OTP and expiry in DB for security
    user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send email
    await sendMail({
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Your password reset OTP is: ${otp}. It is valid for 10 minutes.`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#4f46e5; padding:20px; text-align:center; color:#ffffff; font-size:22px; font-weight:bold;">
              🔐 Password Reset OTP
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333333;">

              <p style="font-size:16px;">Hello,</p>

              <p style="font-size:15px; line-height:1.6;">
                We received a request to reset your password. Use the OTP below to proceed:
              </p>

              <!-- OTP Box -->
              <div style="text-align:center; margin:30px 0;">
                <span style="
                  display:inline-block;
                  background:#eef2ff;
                  color:#4f46e5;
                  font-size:30px;
                  font-weight:bold;
                  padding:15px 30px;
                  border-radius:8px;
                  letter-spacing:5px;
                ">
                  ${otp}
                </span>
              </div>

              <p style="font-size:14px; color:#555;">
                ⏳ This OTP is valid for <strong>10 minutes</strong>.
              </p>

              <p style="font-size:14px; color:#999; margin-top:25px;">
                If you didn’t request this, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; text-align:center; padding:15px; font-size:12px; color:#888;">
              © 2026 Academic Project Platform • All rights reserved
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
    });

    res.status(200).json({ status: 'success', message: 'An OTP has been sent to your email.' });
  } catch (error) {
    console.error('Forgot password OTP error:', error);
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
export const resetPasswordOtp = async (req, res) => {
  try {
    const { email, role, otp, newPassword } = req.body;
    if (!email || !role || !otp || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields.' });
    }

    let UserModel;
    if (role === 'Student') {
      UserModel = Student;
    } else if (role === 'Staff' || role === 'Guide') {
      UserModel = Staff;
    } else if (role === 'HOD') {
      UserModel = HOD;
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid role.' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    
    // Find user by email and verify the hashed OTP matches & hasn't expired
    const user = await UserModel.findOne({
      email,
      resetPasswordToken: hashedOtp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP.' });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await notifyPasswordChange(user);

    res.status(200).json({ status: 'success', message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password OTP error:', error);
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

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

    let { email, password, role } = req.body;
    // Map 'Guide' to 'Staff' internally
    if (role === 'Guide') role = 'Staff';

    // Determine which model to use based on role
    let UserModel;
    if (role === 'Student') {
      UserModel = Student;
    } else if (role === 'Staff') {
      UserModel = Staff;
        console.warn(`[LOGIN FAIL] No user found for email: ${email}, role: ${role}`);
    } else if (role === 'HOD') {
      UserModel = HOD;
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be Student, Staff, HOD, or Guide'
      });
    }
        console.warn(`[LOGIN FAIL] User inactive: ${email}, role: ${role}`);

    // Check if user exists (include password for comparison)
    const user = await UserModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
        console.warn(`[LOGIN FAIL] Wrong password for email: ${email}, role: ${role}`);

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

    // Extra strict check before success response
    if (!token || !user._id || !user.email) {
      console.error(`[LOGIN ERROR] Missing token or user info for email: ${email}, role: ${role}`);
      return res.status(500).json({
        status: 'error',
        message: 'Server error during login',
        error: 'Missing token or user info'
      });
    }

    // Send Login Notification
    await notifyLogin(user, req);
    
    // Log activity
    const { logActivity } = await import('../utils/logger.js');
    await logActivity({
      userId: user._id,
      userModel: user.constructor.modelName, // 'Student', 'Staff', 'HOD'
      action: 'LOGIN',
      resource: 'Auth',
      details: { ip: req.ip, userAgent: req.get('User-Agent') }
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: req.body.role, // Return the originally requested role for clarity
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

    // Select password to allow comparison for password updates
    const user = await UserModel.findById(userId).select('+password');

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

    // Allow email update with uniqueness check
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await UserModel.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already in use'
        });
      }
      user.email = req.body.email;
    }

    // Update password if provided
    let passwordChanged = false;
    if (req.body.password) {
      // Require currentPassword and check
      if (!req.body.currentPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is required to change password.'
        });
      }
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect.'
        });
      }

      // Check if new password is same as old
      const isSamePassword = await user.comparePassword(req.body.password);
      if (isSamePassword) {
        return res.status(400).json({
          status: 'error',
          message: 'New password cannot be the same as the current password.'
        });
      }

      user.password = req.body.password;
      passwordChanged = true;
    }

    const updatedUser = await user.save();

    if (passwordChanged) {
      await notifyPasswordChange(updatedUser);
    }

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
