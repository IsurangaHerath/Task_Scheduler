const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const authController = require('../controllers/authController');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
    '/register',
    [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required')
            .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    validate,
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    [
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
    ],
    validate,
    authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
    '/profile',
    protect,
    [
        body('name')
            .optional()
            .trim()
            .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
        body('email')
            .optional()
            .trim()
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail()
    ],
    validate,
    authController.updateProfile
);

/**
 * @route   PUT /api/auth/password
 * @desc    Change user password
 * @access  Private
 */
router.put(
    '/password',
    protect,
    [
        body('currentPassword')
            .notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    validate,
    authController.changePassword
);

/**
 * @route   GET /api/auth/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/settings', protect, authController.getSettings);

/**
 * @route   PUT /api/auth/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put(
    '/settings',
    protect,
    [
        body('notifications.email')
            .optional()
            .isBoolean().withMessage('Email notification setting must be a boolean'),
        body('notifications.browser')
            .optional()
            .isBoolean().withMessage('Browser notification setting must be a boolean'),
        body('theme')
            .optional()
            .isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
        body('reminderTime')
            .optional()
            .isInt({ min: 1, max: 60 }).withMessage('Reminder time must be between 1 and 60 minutes')
    ],
    validate,
    authController.updateSettings
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete(
    '/account',
    protect,
    [
        body('password')
            .notEmpty().withMessage('Password is required to delete account')
    ],
    validate,
    authController.deleteAccount
);

module.exports = router;
