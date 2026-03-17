import express from 'express';
import Deadline from '../models/Deadline.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all global deadlines (accessible by all authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    const deadlines = await Deadline.find().sort({ date: 1 });
    res.json({ success: true, data: deadlines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a global deadline (HOD only)
router.post('/', protect, authorize('HOD', 'Admin'), async (req, res) => {
  try {
    const deadline = await Deadline.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: deadline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a deadline (HOD only)
router.delete('/:id', protect, authorize('HOD', 'Admin'), async (req, res) => {
  try {
    await Deadline.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deadline deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;