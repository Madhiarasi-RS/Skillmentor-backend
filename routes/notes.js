const express = require('express');
const Note = require('../models/Note');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create a note
// @route   POST /api/notes
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, courseId, moduleIndex, tags } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const note = await Note.create({
      title,
      content,
      student: req.user._id,
      course: courseId,
      moduleIndex,
      tags: tags || []
    });

    const populatedNote = await Note.findById(note._id)
      .populate('course', 'title')
      .populate('student', 'name');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note: populatedNote }
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's notes
// @route   GET /api/notes
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { courseId, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { student: req.user._id };
    
    if (courseId) {
      query.course = courseId;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const notes = await Note.find(query)
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Note.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        notes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('course', 'title')
      .populate('student', 'name');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user owns this note
    if (note.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: { note }
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content, moduleIndex, tags } = req.body;

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user owns this note
    if (note.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        moduleIndex,
        tags: tags || []
      },
      { new: true, runValidators: true }
    ).populate('course', 'title');

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note: updatedNote }
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user owns this note
    if (note.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Generate AI summary for note
// @route   POST /api/notes/:id/summary
// @access  Private
router.post('/:id/summary', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user owns this note
    if (note.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mock AI summary generation (replace with actual AI API call)
    const summary = generateMockSummary(note.content);
    
    note.summary = summary;
    await note.save();

    res.status(200).json({
      success: true,
      message: 'Summary generated successfully',
      data: { summary }
    });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mock AI summary function (replace with actual AI integration)
function generateMockSummary(content) {
  const sentences = content.split('.').filter(s => s.trim().length > 0);
  const keyPoints = sentences.slice(0, 3).map(s => s.trim()).join('. ');
  return `Key Points: ${keyPoints}. This summary was generated using AI to highlight the main concepts from your notes.`;
}

module.exports = router;