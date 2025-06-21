const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Enroll in a course
// @route   POST /api/enrollments
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Check if course exists and is active
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or inactive'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Already enrolled in this course'
        });
      } else {
        // Reactivate enrollment
        existingEnrollment.isActive = true;
        existingEnrollment.startDate = new Date();
        await existingEnrollment.save();

        return res.status(200).json({
          success: true,
          message: 'Re-enrolled in course successfully',
          data: { enrollment: existingEnrollment }
        });
      }
    }

    // Create new enrollment
    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title instructor difficulty duration category image');

    res.status(201).json({
      success: true,
      message: 'Enrolled in course successfully',
      data: { enrollment: populatedEnrollment }
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user enrollments
// @route   GET /api/enrollments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { student: req.user._id };

    // Filter by status
    if (req.query.status) {
      if (req.query.status === 'completed') {
        query.progress = 100;
      } else if (req.query.status === 'in-progress') {
        query.progress = { $lt: 100 };
      }
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const enrollments = await Enrollment.find(query)
      .populate('course', 'title instructor difficulty duration category image')
      .sort({ lastAccessedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enrollment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        enrollments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course')
      .populate('student', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment or is admin
    if (enrollment.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: { enrollment }
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { progress, completedModuleIndex } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be between 0 and 100'
      });
    }

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update progress
    enrollment.progress = progress;
    enrollment.lastAccessedAt = new Date();

    // Add completed module if provided
    if (completedModuleIndex !== undefined) {
      const existingModule = enrollment.completedModules.find(
        m => m.moduleIndex === completedModuleIndex
      );

      if (!existingModule) {
        enrollment.completedModules.push({
          moduleIndex: completedModuleIndex,
          completedAt: new Date()
        });
      }
    }

    await enrollment.save();

    const updatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title instructor difficulty duration category image');

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: { enrollment: updatedEnrollment }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Unenroll from course
// @route   DELETE /api/enrollments/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete - mark as inactive
    enrollment.isActive = false;
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Unenrolled from course successfully'
    });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get enrollment by course and student
// @route   GET /api/enrollments/course/:courseId
// @access  Private
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId,
      isActive: true
    }).populate('course', 'title instructor difficulty duration category image');

    res.status(200).json({
      success: true,
      data: { enrollment }
    });
  } catch (error) {
    console.error('Get enrollment by course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;