import express from 'express';
import ProjectMarks from '../models/ProjectMarks.js';
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
      return res.status(400).json({ message: "Marks cannot exceed 40" });
    }

    const marks = await ProjectMarks.findOneAndUpdate(
      { studentId, projectId },
      {
        staffId: req.user._id,
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
      status: status
    });

    res.json({ success: true, marks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error assigning marks" });
  }
});

// Get Marks for Student (Student Only)
router.get("/my-marks", protect, authorize('Student'), async (req, res) => {
  try {
    const marks = await ProjectMarks.findOne({ studentId: req.user._id }).populate('projectId', 'title');
    res.json({ success: true, data: marks });
  } catch (err) {
    res.status(500).json({ message: "Error fetching marks" });
  }
});

// Get All Marks (HOD)
router.get("/all", protect, authorize('HOD'), async (req, res) => {
  try {
    const marks = await ProjectMarks.find()
      .populate('studentId', 'name studentId')
      .populate('projectId', 'title')
      .populate('staffId', 'name');
    res.json({ success: true, data: marks });
  } catch (err) {
    res.status(500).json({ message: "Error fetching marks" });
  }
});

export default router;