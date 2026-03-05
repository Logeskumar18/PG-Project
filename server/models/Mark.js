import mongoose from 'mongoose';

const markSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  titleMarks: { type: Number, default: 0 },
  progressMarks: { type: Number, default: 0 },
  documentMarks: { type: Number, default: 0 },
  interactionMarks: { type: Number, default: 0 },
  finalReviewMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  remarks: { type: String },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  evaluatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Mark', markSchema);