import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['HOD', 'Staff', 'Student'],
        message: 'Role must be either HOD, Staff, or Student'
      },
      required: [true, 'Please specify a role']
    },
    department: {
      type: String,
      trim: true
    },
    employeeId: {
      type: String,
      sparse: true, // Allows multiple null values
      trim: true
    },
    studentId: {
      type: String,
      sparse: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ employeeId: 1 }, { sparse: true });
userSchema.index({ studentId: 1 }, { sparse: true });

const User = mongoose.model('User', userSchema);

export default User;
