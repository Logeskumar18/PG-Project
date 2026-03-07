import express from 'express';
import Mark from '../models/Mark.js';

import Project from '../models/Project.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Assign/Update Marks (Staff Only)
router.post("/assign-marks", protect, authorize('Staff'), async (req, res) => {
  try {
    const {
      studentId,
      projectId,
      titleMarks,
      progressMarks,
      documentMarks,
      interactionMarks,
      finalReviewMarks,
      remarks
    } = req.body;

    const totalMarks =
      Number(titleMarks) +
      Number(progressMarks) +
      Number(documentMarks) +
      Number(interactionMarks) +
      Number(finalReviewMarks);

    if (totalMarks > 40) {
      return res.status(400).json({ message: "Total marks cannot exceed 40" });
    }

    const marks = await Mark.findOneAndUpdate(
      { studentId, projectId },
      {
        evaluatedBy: req.user._id,
        titleMarks,
        progressMarks,
        documentMarks,
        interactionMarks,
        finalReviewMarks,
        totalMarks,
        remarks,
        evaluatedAt: Date.now()
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Update Project Status based on marks
    let status = 'Evaluated';
    if (totalMarks >= 30) status = 'Approved';
    else if (totalMarks < 20) status = 'Needs Improvement';

    await Project.findByIdAndUpdate(projectId, {
      status: status === 'Approved' ? 'Completed' : 'In Progress',
      approvalStatus: status === 'Approved' ? 'Approved' : 'Pending',
      approvalRemarks: `Marks: ${totalMarks}/40. ${remarks}`
    });

    res.json({ success: true, data: marks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error assigning marks" });
  }
});

// Get Marks for Student (Student Only)
router.get("/my-marks", protect, authorize('Student'), async (req, res) => {
  try {
    const marks = await Mark.find({ studentId: req.user._id })
      .populate('projectId', 'title')
      .sort({ evaluatedAt: -1 });
    
    if (marks.length > 0) {
      // Get the most recent mark
      return res.json({ success: true, data: marks[0] });
    }
    return res.json({ success: true, data: null });
  } catch (err) {
    console.error("Error fetching marks:", err);
    res.status(500).json({ message: "Error fetching marks" });
  }
});

// Get All Marks (HOD)
router.get("/all", protect, authorize('HOD'), async (req, res) => {
  try {
    const marks = await Mark.find()
      .populate('studentId', 'name studentId')
      .populate('projectId', 'title')
      .populate('evaluatedBy', 'name');
    res.json({ success: true, data: marks });
  } catch (err) {
    res.status(500).json({ message: "Error fetching marks" });
  }
});

export default router;
