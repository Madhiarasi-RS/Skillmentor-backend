const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
      name: {
    id:String,
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  profile: {
    fatherName: {
      type: String,
      trim: true,
      maxlength: [100, 'Father name cannot exceed 100 characters']
    },
    motherName: {
      type: String,
      trim: true,
      maxlength: [100, 'Mother name cannot exceed 100 characters']
    },
    education: {
      type: String,
      trim: true,
      maxlength: [200, 'Education cannot exceed 200 characters']
    },
    university: {
      type: String,
      trim: true,
      maxlength: [200, 'University cannot exceed 200 characters']
    },
    degree: {
      type: String,
      trim: true,
      maxlength: [100, 'Degree cannot exceed 100 characters']
    },
    major: {
      type: String,
      trim: true,
      maxlength: [100, 'Major cannot exceed 100 characters']
    },
    yearOfCompletion: {
      type: String,
      trim: true,
      maxlength: [4, 'Year cannot exceed 4 characters']
    },
    contactNo: {
      type: String,
      trim: true,
      maxlength: [20, 'Contact number cannot exceed 20 characters']
    },
    skills: [{
      type: String,
      trim: true,
      maxlength: [50, 'Skill cannot exceed 50 characters']
    }],
    areasOfInterest: [{
      type: String,
      trim: true,
      maxlength: [50, 'Area of interest cannot exceed 50 characters']
    }],
    avatar: {
      type: String,
      default: null
    },
    resumeUrl: {
      type: String,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for enrolled courses count
userSchema.virtual('enrolledCoursesCount', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
  count: true
});

// Virtual for completed courses count
userSchema.virtual('completedCoursesCount', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
  count: true,
  match: { progress: 100 }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user without sensitive data
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);