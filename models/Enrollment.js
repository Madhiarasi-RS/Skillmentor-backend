const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  progress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100']
  },
  completedModules: [{
    moduleIndex: {
      type: Number,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    default: null
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String,
    default: null
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Indexes for better query performance
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ progress: 1 });
enrollmentSchema.index({ completionDate: 1 });

// Virtual for completion status
enrollmentSchema.virtual('isCompleted').get(function() {
  return this.progress === 100;
});

// Virtual for days since enrollment
enrollmentSchema.virtual('daysSinceEnrollment').get(function() {
  const diffTime = Math.abs(new Date() - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Update completion date when progress reaches 100%
enrollmentSchema.pre('save', function(next) {
  if (this.progress === 100 && !this.completionDate) {
    this.completionDate = new Date();
  } else if (this.progress < 100) {
    this.completionDate = null;
  }
  
  this.lastAccessedAt = new Date();
  next();
});

// Static method to get enrollment statistics
enrollmentSchema.statics.getEnrollmentStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        completedEnrollments: {
          $sum: { $cond: [{ $eq: ['$progress', 100] }, 1, 0] }
        },
        averageProgress: { $avg: '$progress' }
      }
    }
  ]);

  return stats[0] || {
    totalEnrollments: 0,
    completedEnrollments: 0,
    averageProgress: 0
  };
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);