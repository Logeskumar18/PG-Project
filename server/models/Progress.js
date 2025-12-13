import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
    }
  },
  { timestamps: true }
);

export default mongoose.model('Progress', progressSchema);
