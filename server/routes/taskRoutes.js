const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const taskController = require('../controllers/taskController');

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for logged in user
 * @access  Private
 */
router.get('/', protect, taskController.getTasks);

/**
 * @route   GET /api/tasks/stats
 * @desc    Get task statistics
 * @access  Private
 */
router.get('/stats', protect, taskController.getStats);

/**
 * @route   GET /api/tasks/today
 * @desc    Get today's tasks
 * @access  Private
 */
router.get('/today', protect, taskController.getTodayTasks);

/**
 * @route   GET /api/tasks/upcoming
 * @desc    Get upcoming tasks
 * @access  Private
 */
router.get('/upcoming', protect, taskController.getUpcomingTasks);

/**
 * @route   GET /api/tasks/completed
 * @desc    Get completed tasks
 * @access  Private
 */
router.get('/completed', protect, taskController.getCompletedTasks);

/**
 * @route   GET /api/tasks/calendar
 * @desc    Get tasks for calendar view
 * @access  Private
 */
router.get('/calendar', protect, taskController.getCalendarTasks);

/**
 * @route   GET /api/tasks/range
 * @desc    Get tasks by date range
 * @access  Private
 */
router.get('/range', protect, taskController.getTasksByRange);

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @access  Private
 */
router.post(
    '/',
    protect,
    [
        body('title')
            .trim()
            .notEmpty().withMessage('Task title is required')
            .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('dueDate')
            .notEmpty().withMessage('Due date is required')
            .isISO8601().withMessage('Please enter a valid date'),
        body('time')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Please enter a valid time in HH:MM format'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
        body('category')
            .optional()
            .trim()
            .isLength({ max: 30 }).withMessage('Category cannot exceed 30 characters'),
        body('reminderEnabled')
            .optional()
            .isBoolean().withMessage('reminderEnabled must be a boolean')
    ],
    validate,
    taskController.createTask
);

/**
 * @route   PUT /api/tasks/reorder
 * @desc    Reorder tasks (drag and drop)
 * @access  Private
 */
router.put(
    '/reorder',
    protect,
    [
        body('taskOrders')
            .isArray().withMessage('taskOrders must be an array'),
        body('taskOrders.*.id')
            .notEmpty().withMessage('Task ID is required'),
        body('taskOrders.*.order')
            .isNumeric().withMessage('Order must be a number')
    ],
    validate,
    taskController.reorderTasks
);

/**
 * @route   PUT /api/tasks/bulk
 * @desc    Bulk update tasks
 * @access  Private
 */
router.put(
    '/bulk',
    protect,
    [
        body('taskIds')
            .isArray().withMessage('taskIds must be an array'),
        body('updates')
            .isObject().withMessage('updates must be an object')
    ],
    validate,
    taskController.bulkUpdate
);

/**
 * @route   DELETE /api/tasks/bulk
 * @desc    Bulk delete tasks
 * @access  Private
 */
router.delete(
    '/bulk',
    protect,
    [
        body('taskIds')
            .isArray().withMessage('taskIds must be an array')
    ],
    validate,
    taskController.bulkDelete
);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task by ID
 * @access  Private
 */
router.get('/:id', protect, taskController.getTask);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private
 */
router.put(
    '/:id',
    protect,
    [
        body('title')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('dueDate')
            .optional()
            .isISO8601().withMessage('Please enter a valid date'),
        body('time')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Please enter a valid time in HH:MM format'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
        body('status')
            .optional()
            .isIn(['pending', 'completed']).withMessage('Status must be pending or completed'),
        body('category')
            .optional()
            .trim()
            .isLength({ max: 30 }).withMessage('Category cannot exceed 30 characters'),
        body('reminderEnabled')
            .optional()
            .isBoolean().withMessage('reminderEnabled must be a boolean')
    ],
    validate,
    taskController.updateTask
);

/**
 * @route   PATCH /api/tasks/:id/complete
 * @desc    Toggle task completion status
 * @access  Private
 */
router.patch('/:id/complete', protect, taskController.toggleComplete);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:id', protect, taskController.deleteTask);

module.exports = router;
