import mongoose from 'mongoose';

const projectMarksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true
  },

  titleMarks: { type: Number, max: 5, default: 0 },
  progressMarks: { type: Number, max: 10, default: 0 },
  documentMarks: { type: Number, max: 15, default: 0 },
  interactionMarks: { type: Number, max: 5, default: 0 },
  finalReviewMarks: { type: Number, max: 5, default: 0 },

  totalMarks: { type: Number, max: 40 },

  remarks: { type: String },

  evaluatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("ProjectMarks", projectMarksSchema);