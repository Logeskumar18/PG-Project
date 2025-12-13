import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: ['srs', 'ppt', 'report', 'code', 'other'],
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    comments: {
      type: String
    },
    reviewStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Needs Review', 'Rejected'],
      default: 'Pending'
    },
    remarks: {
      type: String
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
