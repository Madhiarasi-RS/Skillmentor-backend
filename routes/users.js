const express = require('express');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { validateProfileUpdate } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile (public access)
// @route   GET /api/users/profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findOne() // Default: fetch any user
      .populate('enrolledCoursesCount')
      .populate('completedCoursesCount');

    res.status(200).json({
      success: true,
      user: user ? user.toSafeObject() : null
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});// ✅ Auth middleware must populate req.user.id
router.put('/profile', protect, validateProfileUpdate, async (req, res) => {

  try {
    const updateData = {};

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.profile) updateData.profile = { ...req.body.profile };

    const user = await User.findByIdAndUpdate(
      req.user.id, // ✅ Securely update only the logged-in user's profile
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user?.toSafeObject()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// @desc    Get dashboard data (public access)
// @route   GET /api/users/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const enrollments = await Enrollment.find({ student: user._id, isActive: true })
      .populate('course', 'title instructor difficulty duration category image')
      .sort({ lastAccessedAt: -1 });

    const totalEnrollments = enrollments.length;
    const completedCourses = enrollments.filter(e => e.progress === 100).length;
    const averageProgress = enrollments.length
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0;

    const recentActivity = enrollments.slice(0, 5).map(e => ({
      type: 'course_access',
      courseTitle: e.course.title,
      progress: e.progress,
      lastAccessed: e.lastAccessedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalEnrollments,
          completedCourses,
          averageProgress,
          studyStreak: 7 // Mock value
        },
        enrollments,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all users (public)
// @route   GET /api/users
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('enrolledCoursesCount')
      .populate('completedCoursesCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user by ID (public)
// @route   GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('enrolledCoursesCount')
      .populate('completedCoursesCount');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const enrollments = await Enrollment.find({ student: user._id })
      .populate('course', 'title instructor category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        enrollments
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user status (public)// @route   PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const updatedFields = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Full user update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete user (public)
// @route   DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin users' });
    }

    await Enrollment.deleteMany({ student: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
