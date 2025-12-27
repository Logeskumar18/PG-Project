import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    // Solo project
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: false
    },

    // Team project
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }
    ],

    // Assigned guide
    assignedGuideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: false
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    // Project workflow
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'In Progress', 'Completed'],
      default: 'Submitted'
    },

    // Approval workflow
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },

    approvalRemarks: String,
    approvedAt: Date,

    submittedAt: {
      type: Date,
      default: Date.now
    },

    submissionDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
