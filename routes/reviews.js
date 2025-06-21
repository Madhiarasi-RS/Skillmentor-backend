const express = require('express');
const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect, authorize } = require('../middleware/auth');
const { validateReviewCreation } = require('../middleware/validation');

const router = express.Router();

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, validateReviewCreation, async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      isActive: true
    });

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'You must be enrolled in this course to leave a review'
      });
    }

    // Check if user has already reviewed this course
    const existingReview = await Review.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this course'
      });
    }

    // Create review
    const review = await Review.create({
      student: req.user._id,
      course: courseId,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id)
      .populate('student', 'name')
      .populate('course', 'title');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review: populatedReview }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get reviews for a course
// @route   GET /api/reviews/course/:courseId
// @access  Public
router.get('/course/:courseId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { 
      course: req.params.courseId,
      isApproved: true
    };

    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'highest-rating':
          sortOption = { rating: -1, createdAt: -1 };
          break;
        case 'lowest-rating':
          sortOption = { rating: 1, createdAt: -1 };
          break;
        case 'most-helpful':
          sortOption = { helpfulVotes: -1, createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    const reviews = await Review.find(query)
      .populate('student', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);

    // Get review statistics
    const stats = await Review.getCourseReviewStats(req.params.courseId);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get course reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
router.get('/my-reviews', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ student: req.user._id })
      .populate('course', 'title instructor image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ student: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', protect, validateReviewCreation, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update review
    review.rating = rating;
    review.comment = comment;
    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate('student', 'name')
      .populate('course', 'title');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review or is admin
    if (review.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Vote review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Increment helpful votes
    review.helpfulVotes += 1;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: { helpfulVotes: review.helpfulVotes }
    });
  } catch (error) {
    console.error('Vote helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
router.post('/:id/report', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user has already reported this review
    const existingReport = review.reportedBy.find(
      report => report.user.toString() === req.user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    // Add report
    review.reportedBy.push({
      user: req.user._id,
      reason: reason.trim()
    });

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;