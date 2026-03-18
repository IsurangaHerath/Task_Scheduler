const Task = require('../models/Task');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Task Controller
 * 
 * Handles all task-related API endpoints including CRUD operations,
 * task filtering, statistics, and bulk operations.
 * All routes require authentication (user must be logged in).
 */

// ==================== READ Operations ====================

/**
 * Get all tasks for the authenticated user
 * 
 * Supports filtering by status, priority, and category.
 * Supports search by task title.
 * 
 * @route GET /api/tasks
 * @access Private
 * @query {string} status - Filter by 'pending' or 'completed'
 * @query {string} priority - Filter by 'low', 'medium', or 'high'
 * @query {string} category - Filter by category name
 * @query {string} search - Search tasks by title
 * @query {number} limit - Maximum number of tasks to return (default: 100)
 */
const getTasks = asyncHandler(async (req, res) => {
    const { status, priority, category, search, limit = 100 } = req.query;

    // Build query filter options
    const filterOptions = { limit: parseInt(limit) };
    if (status && ['pending', 'completed'].includes(status)) {
        filterOptions.status = status;
    }
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
        filterOptions.priority = priority;
    }
    if (category) {
        filterOptions.category = category;
    }

    // Fetch tasks from database
    let tasks = Task.findAll(req.user.id, filterOptions);

    // Apply client-side search filtering
    if (search) {
        const searchTerm = search.toLowerCase();
        tasks = tasks.filter(task => task.title.toLowerCase().includes(searchTerm));
    }

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

/**
 * Get a single task by its ID
 * 
 * @route GET /api/tasks/:id
 * @access Private
 * @param {string} req.params.id - Task ID
 */
const getTask = asyncHandler(async (req, res) => {
    const task = Task.findById(req.params.id);

    // Verify task exists and belongs to the authenticated user
    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    res.json({
        success: true,
        data: { task }
    });
});

/**
 * Get tasks due today
 * 
 * @route GET /api/tasks/today
 * @access Private
 */
const getTodayTasks = asyncHandler(async (req, res) => {
    const tasks = Task.getTodayTasks(req.user.id);

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

/**
 * Get upcoming tasks (future due dates)
 * 
 * @route GET /api/tasks/upcoming
 * @access Private
 * @query {number} days - Number of days to look ahead (default: 7)
 */
const getUpcomingTasks = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const tasks = Task.getUpcomingTasks(req.user.id);
    
    // Apply day filter if specified
    let filteredTasks = tasks;
    if (days) {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + parseInt(days));
        filteredTasks = tasks.filter(task => new Date(task.dueDate) <= endDate);
    }

    res.json({
        success: true,
        count: filteredTasks.length,
        data: { tasks: filteredTasks }
    });
});

/**
 * Get completed tasks
 * 
 * @route GET /api/tasks/completed
 * @access Private
 * @query {number} limit - Maximum number of tasks to return (default: 50)
 */
const getCompletedTasks = asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query;

    const tasks = Task.getCompletedTasks(req.user.id, parseInt(limit));

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

/**
 * Get task statistics and weekly data for charts
 * 
 * @route GET /api/tasks/stats
 * @access Private
 */
const getStats = asyncHandler(async (req, res) => {
    const stats = Task.getStats(req.user.id);

    // Generate weekly data for the past 7 days
    const today = new Date();
    const weekData = [];

    // Get completed and all tasks for the user
    const completedTasks = Task.getCompletedTasks(req.user.id, 1000);
    const allTasks = Task.findAll(req.user.id);

    // Calculate daily statistics for the past week
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayStart = new Date(dateString);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateString);
        dayEnd.setHours(23, 59, 59, 999);

        // Count completed tasks for this day
        const completed = completedTasks.filter(task => {
            if (!task.completedAt) return false;
            const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
            return completedDate === dateString;
        }).length;

        // Count total tasks due on this day
        const total = allTasks.filter(task => {
            const dueDate = new Date(task.dueDate).toISOString().split('T')[0];
            return dueDate === dateString;
        }).length;

        weekData.push({
            date: dateString,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            completed,
            total
        });
    }

    res.json({
        success: true,
        data: { stats, weekData }
    });
});

/**
 * Get tasks within a date range for calendar view
 * 
 * @route GET /api/tasks/calendar
 * @access Private
 * @query {string} start - Start date (ISO format)
 * @query {string} end - End date (ISO format)
 */
const getCalendarTasks = asyncHandler(async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({
            success: false,
            message: 'Start and end dates are required'
        });
    }

    const tasks = Task.getCalendarTasks(req.user.id, start, end);

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

/**
 * Get tasks by date range (alias for getCalendarTasks)
 * 
 * @route GET /api/tasks/range
 * @access Private
 * @query {string} startDate - Start date (ISO format)
 * @query {string} endDate - End date (ISO format)
 */
const getTasksByRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: 'Start date and end date are required'
        });
    }

    const tasks = Task.getCalendarTasks(req.user.id, startDate, endDate);

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

// ==================== CREATE Operations ====================

/**
 * Create a new task
 * 
 * @route POST /api/tasks
 * @access Private
 * @body {string} title - Task title (required)
 * @body {string} description - Task description (optional)
 * @body {string} dueDate - Due date (required)
 * @body {string} time - Due time (default: '09:00')
 * @body {string} priority - Priority level: 'low', 'medium', 'high' (default: 'medium')
 * @body {string} category - Category name (default: 'general')
 * @body {boolean} reminderEnabled - Enable reminder (default: true)
 */
const createTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, time, priority, category, reminderEnabled } = req.body;

    // Get the highest order number to append new task at the end
    const allTasks = Task.findAll(req.user.id);
    const order = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order || 0)) + 1 : 0;

    const newTask = Task.create({
        userId: req.user.id,
        title,
        description: description || '',
        dueDate,
        time: time || '09:00',
        priority: priority || 'medium',
        category: category || 'general',
        reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
        order
    });

    res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: { task: newTask }
    });
});

// ==================== UPDATE Operations ====================

/**
 * Update an existing task
 * 
 * @route PUT /api/tasks/:id
 * @access Private
 * @param {string} req.params.id - Task ID
 * @body {string} title - Task title
 * @body {string} description - Task description
 * @body {string} dueDate - Due date
 * @body {string} time - Due time
 * @body {string} priority - Priority level
 * @body {string} status - Task status: 'pending' or 'completed'
 * @body {string} category - Category name
 * @body {boolean} reminderEnabled - Enable reminder
 */
const updateTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, time, priority, status, category, reminderEnabled } = req.body;

    // Verify task exists and belongs to the authenticated user
    let task = Task.findById(req.params.id);

    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    // Build update payload with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (time !== undefined) updateData.time = time;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
        updateData.status = status;
        // Set completion timestamp when marking as completed
        updateData.completedAt = status === 'completed' ? new Date().toISOString() : null;
    }
    if (category !== undefined) updateData.category = category;
    if (reminderEnabled !== undefined) {
        updateData.reminderEnabled = reminderEnabled;
        // Reset reminder sent flag when re-enabling
        if (reminderEnabled) updateData.reminderSent = false;
    }

    task = Task.update(req.params.id, updateData);

    res.json({
        success: true,
        message: 'Task updated successfully',
        data: { task }
    });
});

/**
 * Toggle task completion status
 * 
 * @route PATCH /api/tasks/:id/complete
 * @access Private
 * @param {string} req.params.id - Task ID
 */
const toggleComplete = asyncHandler(async (req, res) => {
    const task = Task.findById(req.params.id);

    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    // Toggle between pending and completed
    const updatedTask = Task.toggleComplete(req.params.id);

    res.json({
        success: true,
        message: `Task marked as ${updatedTask.status}`,
        data: { task: updatedTask }
    });
});

/**
 * Reorder tasks (for drag and drop functionality)
 * 
 * @route PUT /api/tasks/reorder
 * @access Private
 * @body {Array} taskOrders - Array of { id, order } objects
 */
const reorderTasks = asyncHandler(async (req, res) => {
    const { taskOrders } = req.body;

    if (!taskOrders || !Array.isArray(taskOrders)) {
        return res.status(400).json({
            success: false,
            message: 'taskOrders array is required'
        });
    }

    // Update order for each task
    for (const { id, order } of taskOrders) {
        Task.update(id, { order });
    }

    res.json({
        success: true,
        message: 'Tasks reordered successfully'
    });
});

/**
 * Bulk update multiple tasks
 * 
 * @route PUT /api/tasks/bulk
 * @access Private
 * @body {Array} taskIds - Array of task IDs to update
 * @body {Object} updates - Fields to update on each task
 */
const bulkUpdate = asyncHandler(async (req, res) => {
    const { taskIds, updates } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'taskIds array is required'
        });
    }

    let modifiedCount = 0;
    for (const id of taskIds) {
        const task = Task.findById(id);
        if (task && task.userId === req.user.id) {
            Task.update(id, updates);
            modifiedCount++;
        }
    }

    res.json({
        success: true,
        message: `${modifiedCount} tasks updated`,
        data: { modifiedCount }
    });
});

// ==================== DELETE Operations ====================

/**
 * Delete a task
 * 
 * @route DELETE /api/tasks/:id
 * @access Private
 * @param {string} req.params.id - Task ID
 */
const deleteTask = asyncHandler(async (req, res) => {
    const task = Task.findById(req.params.id);

    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    Task.delete(req.params.id);

    res.json({
        success: true,
        message: 'Task deleted successfully'
    });
});

/**
 * Bulk delete multiple tasks
 * 
 * @route DELETE /api/tasks/bulk
 * @access Private
 * @body {Array} taskIds - Array of task IDs to delete
 */
const bulkDelete = asyncHandler(async (req, res) => {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'taskIds array is required'
        });
    }

    let deletedCount = 0;
    for (const id of taskIds) {
        const task = Task.findById(id);
        if (task && task.userId === req.user.id) {
            Task.delete(id);
            deletedCount++;
        }
    }

    res.json({
        success: true,
        message: `${deletedCount} tasks deleted`,
        data: { deletedCount }
    });
});

// Export all controller functions
module.exports = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
    getTodayTasks,
    getUpcomingTasks,
    getCompletedTasks,
    getStats,
    getCalendarTasks,
    getTasksByRange,
    bulkUpdate,
    bulkDelete
};
