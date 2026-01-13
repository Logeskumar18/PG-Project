import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    // For team projects, use teamId. For solo projects, leave null.
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: false
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    // For solo projects, use studentId. For team projects, use studentId of submitter (optional)
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: false
    },
    weekNumber: {
      type: Number,
      required: true
    },
    progressPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    description: {
      type: String,
      required: true
    },
    tasksCompleted: [{
      type: String
    }],
    challenges: {
      type: String
    },
    nextWeekPlan: {
      type: String
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Pending', 'Satisfactory', 'Not Satisfactory'],
      default: 'Pending'
    },
    feedback: {
      type: String
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Progress', progressSchema);
