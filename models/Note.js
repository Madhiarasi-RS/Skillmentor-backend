const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true,
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
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
  moduleIndex: {
    type: Number,
    min: [1, 'Module index must be at least 1']
  },
  summary: {
    type: String,
    maxlength: [2000, 'Summary cannot exceed 2000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
noteSchema.index({ student: 1, course: 1 });
noteSchema.index({ title: 'text', content: 'text' });
noteSchema.index({ createdAt: -1 });

// Virtual for course name
noteSchema.virtual('courseName', {
  ref: 'Course',
  localField: 'course',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Note', noteSchema);