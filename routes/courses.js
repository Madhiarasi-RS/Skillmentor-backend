const express = require('express');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');

const router = express.Router();

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    if (req.query.difficulty && req.query.difficulty !== 'all') {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    let sortOption = { createdAt: -1 };
    switch (req.query.sort) {
      case 'title':
        sortOption = { title: 1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
    }

    const courses = await Course.find(query)
      .populate('createdBy', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const stats = await course.calculateAverageRating();
        const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
        return {
          ...course.toObject(),
          rating: stats.rating,
          reviewCount: stats.reviewCount,
          enrolledStudents: enrollmentCount
        };
      })
    );

    const total = await Course.countDocuments(query);
    const categories = await Course.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      data: {
        courses: coursesWithStats,
        categories,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('createdBy', 'name');
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const stats = await course.calculateAverageRating();
    const enrollmentCount = await Enrollment.countDocuments({ course: course._id });

    const reviews = await Review.find({ course: course._id, isApproved: true })
      .populate('student', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        course: {
          ...course.toObject(),
          rating: stats.rating,
          reviewCount: stats.reviewCount,
          enrolledStudents: enrollmentCount
        },
        isEnrolled: false,
        enrollment: null,
        reviews
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create course
// @route   POST /api/courses
// @access  Public (for demo purpose)

// Create course - POST /api/courses
router.post('/', async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      // Assume req.user.id is set from auth middleware
      createdBy: req.user?.id || null, // fallback if no auth, else replace with actual logged in user ID
    };

    // if (!courseData.createdBy) {
    //   return res.status(401).json({ success: false, message: 'Unauthorized: createdBy is required' });
    // }

    const course = await Course.create(courseData);

    res.status(201).json({ success: true, message: 'Course created successfully', data: { course } });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Public (for demo purpose)
router.put('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Course updated successfully', data: { course: updatedCourse } });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Public (for demo purpose)
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
    if (enrollmentCount > 0) {
      course.isActive = false;
      await course.save();
      return res.status(200).json({ success: true, message: 'Course deactivated successfully (has active enrollments)' });
    }

    await Course.findByIdAndDelete(req.params.id);
    await Review.deleteMany({ course: req.params.id });
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
