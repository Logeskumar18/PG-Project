import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  topic: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g. "10:00 AM"
  duration: { type: Number, enum: [15, 30], required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
  meetingLink: { type: String }, // Provided by staff upon approval
  guideRemarks: { type: String }
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);