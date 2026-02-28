const Task = require('../models/Task');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all tasks for logged in user
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = asyncHandler(async (req, res) => {
    const { status, priority, category, search, sort, limit = 100 } = req.query;

    // Build query options
    const options = { limit: parseInt(limit) };
    if (status && ['pending', 'completed'].includes(status)) {
        options.status = status;
    }
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
        options.priority = priority;
    }
    if (category) {
        options.category = category;
    }

    let tasks = Task.findAll(req.user.id, options);

    // Search by title (client-side for simplicity)
    if (search) {
        const searchLower = search.toLowerCase();
        tasks = tasks.filter(t => t.title.toLowerCase().includes(searchLower));
    }

    // Note: Sort options would need to be implemented in the model for full support
    // For now, returning tasks sorted by dueDate (default in findAll)

    res.json({
        success: true,
        count: tasks.length,
        data: {
            tasks
        }
    });
});

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = asyncHandler(async (req, res) => {
    const task = Task.findById(req.params.id);

    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    res.json({
        success: true,
        data: {
            task
        }
    });
});

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, time, priority, category, reminderEnabled } = req.body;

    // Get the highest order for the user's tasks
    const allTasks = Task.findAll(req.user.id);
    const order = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order || 0)) + 1 : 0;

    const task = Task.create({
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
        data: {
            task
        }
    });
});

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, time, priority, status, category, reminderEnabled } = req.body;

    // Find task
    let task = Task.findById(req.params.id);

    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (time !== undefined) updateData.time = time;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
        updateData.status = status;
        updateData.completedAt = status === 'completed' ? new Date().toISOString() : null;
    }
    if (category !== undefined) updateData.category = category;
    if (reminderEnabled !== undefined) {
        updateData.reminderEnabled = reminderEnabled;
        if (reminderEnabled) updateData.reminderSent = false;
    }

    task = Task.update(req.params.id, updateData);

    res.json({
        success: true,
        message: 'Task updated successfully',
        data: {
            task
        }
    });
});

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
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
 * @desc    Toggle task completion status
 * @route   PATCH /api/tasks/:id/complete
 * @access  Private
 */
const toggleComplete = asyncHandler(async (req, res) => {
    const task = Task.findById(req.params.id);

    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    // Toggle status
    const updatedTask = Task.toggleComplete(req.params.id);

    res.json({
        success: true,
        message: `Task marked as ${updatedTask.status}`,
        data: {
            task: updatedTask
        }
    });
});

/**
 * @desc    Reorder tasks (drag and drop)
 * @route   PUT /api/tasks/reorder
 * @access  Private
 */
const reorderTasks = asyncHandler(async (req, res) => {
    const { taskOrders } = req.body; // Array of { id, order }

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
 * @desc    Get today's tasks
 * @route   GET /api/tasks/today
 * @access  Private
 */
const getTodayTasks = asyncHandler(async (req, res) => {
    const tasks = Task.getTodayTasks(req.user.id);

    res.json({
        success: true,
        count: tasks.length,
        data: {
            tasks
        }
    });
});

/**
 * @desc    Get upcoming tasks
 * @route   GET /api/tasks/upcoming
 * @access  Private
 */
const getUpcomingTasks = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const tasks = Task.getUpcomingTasks(req.user.id);
    
    // Filter by days if needed
    let filteredTasks = tasks;
    if (days) {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + parseInt(days));
        filteredTasks = tasks.filter(t => new Date(t.dueDate) <= endDate);
    }

    res.json({
        success: true,
        count: filteredTasks.length,
        data: {
            tasks: filteredTasks
        }
    });
});

/**
 * @desc    Get completed tasks
 * @route   GET /api/tasks/completed
 * @access  Private
 */
const getCompletedTasks = asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query;

    const tasks = Task.getCompletedTasks(req.user.id, parseInt(limit));

    res.json({
        success: true,
        count: tasks.length,
        data: {
            tasks
        }
    });
});

/**
 * @desc    Get task statistics
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getStats = asyncHandler(async (req, res) => {
    const stats = Task.getStats(req.user.id);

    // Get weekly data for chart
    const today = new Date();
    const weekData = [];

    // Get all completed tasks for the week
    const completedTasks = Task.getCompletedTasks(req.user.id, 1000);
    const allTasks = Task.findAll(req.user.id);

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayStart = new Date(dateStr);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateStr);
        dayEnd.setHours(23, 59, 59, 999);

        const completed = completedTasks.filter(t => {
            if (!t.completedAt) return false;
            const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
            return completedDate === dateStr;
        }).length;

        const total = allTasks.filter(t => {
            const dueDate = new Date(t.dueDate).toISOString().split('T')[0];
            return dueDate === dateStr;
        }).length;

        weekData.push({
            date: dateStr,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            completed,
            total
        });
    }

    res.json({
        success: true,
        data: {
            stats,
            weekData
        }
    });
});

/**
 * @desc    Get tasks for calendar view
 * @route   GET /api/tasks/calendar
 * @access  Private
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
        data: {
            tasks
        }
    });
});

/**
 * @desc    Get tasks by date range
 * @route   GET /api/tasks/range
 * @access  Private
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
        data: {
            tasks
        }
    });
});

/**
 * @desc    Bulk update tasks
 * @route   PUT /api/tasks/bulk
 * @access  Private
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
        data: {
            modifiedCount
        }
    });
});

/**
 * @desc    Bulk delete tasks
 * @route   DELETE /api/tasks/bulk
 * @access  Private
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
        data: {
            deletedCount
        }
    });
});

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
