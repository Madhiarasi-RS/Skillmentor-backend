const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    instructor: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    duration: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    youtubeUrl: {
      type: String,
      default: '',
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
        },
        message: 'Please enter a valid YouTube URL',
      },
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
courseSchema.virtual('rating', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
  justOne: false,
});

courseSchema.virtual('reviewCount', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
  count: true,
});

courseSchema.virtual('enrolledStudents', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course',
  count: true,
});

// Indexes
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ createdAt: -1 });

// Instance method to calculate average rating
courseSchema.methods.calculateAverageRating = async function () {
  const Review = mongoose.model('Review');

  const stats = await Review.aggregate([
    { $match: { course: this._id, isApproved: true } },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    return {
      rating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].totalReviews,
    };
  }

  return { rating: 0, reviewCount: 0 };
};

module.exports = mongoose.model('Course', courseSchema);
