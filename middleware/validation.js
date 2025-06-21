const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Course creation validation
const validateCourseCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('instructor')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Instructor name must be between 2 and 100 characters'),
  body('difficulty')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Difficulty must be Beginner, Intermediate, or Advanced'),
  body('duration')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Duration must be between 1 and 50 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  body('syllabus')
    .isArray({ min: 1 })
    .withMessage('Syllabus must be an array with at least one item'),
  handleValidationErrors
];

// Review creation validation
const validateReviewCreation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('profile.fatherName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Father name cannot exceed 100 characters'),
  body('profile.motherName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Mother name cannot exceed 100 characters'),
  body('profile.education')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Education cannot exceed 200 characters'),
  body('profile.university')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('University cannot exceed 200 characters'),
  body('profile.contactNo')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Contact number cannot exceed 20 characters'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateCourseCreation,
  validateReviewCreation,
  validateProfileUpdate,
  handleValidationErrors
};