import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all activity logs
router.get('/', protect, async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build query filter based on request query parameters
    const query = {};
    if (req.query.action) query.action = req.query.action;
    if (req.query.role) query.userModel = req.query.role;
    
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end day
        query.createdAt.$lte = endDate;
      }
    }

    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await ActivityLog.countDocuments(query);

    res.json({ 
      success: true, 
      count: logs.length, 
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: logs 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;