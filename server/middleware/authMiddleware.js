import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import HOD from '../models/HOD.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find user in all collections
      let user = null;
      let userRole = null;

      user = await Student.findById(decoded.id).select('-password');
      if (user) userRole = 'Student';

      if (!user) {
        user = await Staff.findById(decoded.id).select('-password');
        if (user) userRole = 'Staff';
      }

      if (!user) {
        user = await HOD.findById(decoded.id).select('-password');
        if (user) userRole = 'HOD';
      }

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'User account is deactivated'
        });
      }

      // Add user and role to request
      req.user = user.toObject();
      req.user.role = userRole;

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, no token'
    });
  }
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Generate JWT Token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
