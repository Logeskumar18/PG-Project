import mongoose from 'mongoose';

const deadlineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    enum: ['Proposal Deadline', 'Progress Review 1', 'Progress Review 2', 'Final Submission', 'Other']
  },
  customTitle: { type: String }, // Used if title is 'Other'
  date: { type: Date, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Deadline', deadlineSchema);