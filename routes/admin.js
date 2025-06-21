const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get basic counts
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalCourses = await Course.countDocuments({ isActive: true });
    const totalEnrollments = await Enrollment.countDocuments({ isActive: true });
    const totalReviews = await Review.countDocuments({ isApproved: true });

    // Get enrollment statistics
    const enrollmentStats = await Enrollment.getEnrollmentStats();

    // Get average rating across all courses
    const ratingStats = await Review.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;

    // Get monthly growth data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyGrowth = await User.aggregate([
      {
        $match: {
          role: 'student',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top performing courses
    const topCourses = await Course.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'course',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          enrollmentCount: { $size: '$enrollments' },
          averageRating: { $avg: '$reviews.rating' },
          reviewCount: { $size: '$reviews' }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          instructor: 1,
          category: 1,
          enrollmentCount: 1,
          averageRating: 1,
          reviewCount: 1
        }
      }
    ]);

    // Get recent activities
    const recentEnrollments = await Enrollment.find({ isActive: true })
      .populate('student', 'name')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReviews = await Review.find({ isApproved: true })
      .populate('student', 'name')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get category distribution
    const categoryStats = await Course.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalCourses,
          totalEnrollments,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          completionRate: Math.round((enrollmentStats.completedEnrollments / enrollmentStats.totalEnrollments) * 100) || 0
        },
        monthlyGrowth,
        topCourses,
        categoryStats,
        recentActivity: {
          enrollments: recentEnrollments,
          reviews: recentReviews
        }
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private/Admin
router.get('/analytics/users', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // User registration trends
    const registrationTrends = await User.aggregate([
      {
        $match: {
          role: 'student',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // User activity (based on last login)
    const activeUsers = await User.countDocuments({
      role: 'student',
      lastLogin: { $gte: startDate },
      isActive: true
    });

    const inactiveUsers = await User.countDocuments({
      role: 'student',
      $or: [
        { lastLogin: { $lt: startDate } },
        { lastLogin: null }
      ],
      isActive: true
    });

    // User engagement by course completion
    const engagementStats = await Enrollment.aggregate([
      {
        $group: {
          _id: '$student',
          totalEnrollments: { $sum: 1 },
          completedCourses: {
            $sum: { $cond: [{ $eq: ['$progress', 100] }, 1, 0] }
          },
          averageProgress: { $avg: '$progress' }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          averageEnrollments: { $avg: '$totalEnrollments' },
          averageCompletions: { $avg: '$completedCourses' },
          overallProgress: { $avg: '$averageProgress' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        registrationTrends,
        userActivity: {
          active: activeUsers,
          inactive: inactiveUsers,
          total: activeUsers + inactiveUsers
        },
        engagement: engagementStats[0] || {
          totalUsers: 0,
          averageEnrollments: 0,
          averageCompletions: 0,
          overallProgress: 0
        }
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get course analytics
// @route   GET /api/admin/analytics/courses
// @access  Private/Admin
router.get('/analytics/courses', async (req, res) => {
  try {
    // Course performance metrics
    const coursePerformance = await Course.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'course',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          enrollmentCount: { $size: '$enrollments' },
          completedCount: {
            $size: {
              $filter: {
                input: '$enrollments',
                cond: { $eq: ['$$this.progress', 100] }
              }
            }
          },
          averageRating: { $avg: '$reviews.rating' },
          reviewCount: { $size: '$reviews' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$enrollmentCount', 0] },
              { $multiply: [{ $divide: ['$completedCount', '$enrollmentCount'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          difficulty: 1,
          enrollmentCount: 1,
          completedCount: 1,
          completionRate: 1,
          averageRating: 1,
          reviewCount: 1
        }
      },
      { $sort: { enrollmentCount: -1 } }
    ]);

    // Category performance
    const categoryPerformance = await Course.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $group: {
          _id: '$category',
          courseCount: { $sum: 1 },
          totalEnrollments: { $sum: { $size: '$enrollments' } },
          averageEnrollments: { $avg: { $size: '$enrollments' } }
        }
      },
      { $sort: { totalEnrollments: -1 } }
    ]);

    // Difficulty level distribution
    const difficultyStats = await Course.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        coursePerformance,
        categoryPerformance,
        difficultyStats
      }
    });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get reported reviews
// @route   GET /api/admin/reported-reviews
// @access  Private/Admin
router.get('/reported-reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reportedReviews = await Review.find({
      'reportedBy.0': { $exists: true }
    })
    .populate('student', 'name email')
    .populate('course', 'title')
    .sort({ 'reportedBy.reportedAt': -1 })
    .skip(skip)
    .limit(limit);

    const total = await Review.countDocuments({
      'reportedBy.0': { $exists: true }
    });

    res.status(200).json({
      success: true,
      data: {
        reviews: reportedReviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reported reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Moderate review (approve/reject)
// @route   PUT /api/admin/reviews/:id/moderate
// @access  Private/Admin
router.put('/reviews/:id/moderate', async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either approve or reject'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (action === 'approve') {
      review.isApproved = true;
      review.reportedBy = []; // Clear reports
    } else {
      review.isApproved = false;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: `Review ${action}d successfully`,
      data: { review }
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;