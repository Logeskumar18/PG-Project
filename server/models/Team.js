import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    members: [{
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
      },
      role: {
        type: String,
        enum: ['Leader', 'Member'],
        default: 'Member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    teamSize: {
      type: Number,
      default: 1
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Completed'],
      default: 'Active'
    },
    description: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Update team size when members change
teamSchema.pre('save', function (next) {
  this.teamSize = this.members.length;
  next();
});

export default mongoose.model('Team', teamSchema);
