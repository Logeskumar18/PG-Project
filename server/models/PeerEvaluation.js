import mongoose from 'mongoose';

const peerEvaluationSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  evaluateeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  score: { type: Number, required: true, min: 1, max: 10 },
  comments: { type: String }
}, { timestamps: true });

// Prevent a student from evaluating the exact same peer multiple times
peerEvaluationSchema.index({ teamId: 1, evaluatorId: 1, evaluateeId: 1 }, { unique: true });

export default mongoose.model('PeerEvaluation', peerEvaluationSchema);