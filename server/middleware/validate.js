const { validationResult } = require('express-validator');

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.path,
            message: error.msg
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
    }

    next();
};

/**
 * Common validation rules for authentication
 */
const authValidation = {
    register: [
        require('express-validator').body('name')
            .trim()
            .notEmpty().withMessage('Name is required')
            .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),

        require('express-validator').body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail(),

        require('express-validator').body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],

    login: [
        require('express-validator').body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail(),

        require('express-validator').body('password')
            .notEmpty().withMessage('Password is required')
    ],

    updateProfile: [
        require('express-validator').body('name')
            .optional()
            .trim()
            .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),

        require('express-validator').body('email')
            .optional()
            .trim()
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail()
    ],

    changePassword: [
        require('express-validator').body('currentPassword')
            .notEmpty().withMessage('Current password is required'),

        require('express-validator').body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ]
};

/**
 * Common validation rules for tasks
 */
const taskValidation = {
    create: [
        require('express-validator').body('title')
            .trim()
            .notEmpty().withMessage('Task title is required')
            .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

        require('express-validator').body('description')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

        require('express-validator').body('dueDate')
            .notEmpty().withMessage('Due date is required')
            .isISO8601().withMessage('Please enter a valid date'),

        require('express-validator').body('time')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Please enter a valid time in HH:MM format'),

        require('express-validator').body('priority')
            .optional()
            .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),

        require('express-validator').body('category')
            .optional()
            .trim()
            .isLength({ max: 30 }).withMessage('Category cannot exceed 30 characters'),

        require('express-validator').body('reminderEnabled')
            .optional()
            .isBoolean().withMessage('reminderEnabled must be a boolean')
    ],

    update: [
        require('express-validator').body('title')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

        require('express-validator').body('description')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

        require('express-validator').body('dueDate')
            .optional()
            .isISO8601().withMessage('Please enter a valid date'),

        require('express-validator').body('time')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Please enter a valid time in HH:MM format'),

        require('express-validator').body('priority')
            .optional()
            .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),

        require('express-validator').body('status')
            .optional()
            .isIn(['pending', 'completed']).withMessage('Status must be pending or completed'),

        require('express-validator').body('category')
            .optional()
            .trim()
            .isLength({ max: 30 }).withMessage('Category cannot exceed 30 characters'),

        require('express-validator').body('reminderEnabled')
            .optional()
            .isBoolean().withMessage('reminderEnabled must be a boolean')
    ]
};

module.exports = {
    validate,
    authValidation,
    taskValidation
};
