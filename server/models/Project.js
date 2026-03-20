import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: false
    },

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

    stage: {
      type: String,
      enum: ['Proposal Submitted', 'Proposal Approved', 'Development', 'Mid Review', 'Testing', 'Final Submission'],
      default: 'Proposal Submitted'
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
    },

    isArchived: {
      type: Boolean,
      default: false
    },
    
    academicYear: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
