const Task = require('../models/Task');
const { asyncHandler } = require('../middleware/errorHandler');

const getTasks = asyncHandler(async (req, res) => {
    const { status, priority, category, search, limit = 100 } = req.query;

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

    let tasks = await Task.findAll(req.user.id, filterOptions);

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

const getTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

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

const getTodayTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.getTodayTasks(req.user.id);

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

const getUpcomingTasks = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const tasks = await Task.getUpcomingTasks(req.user.id);
    
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

const getCompletedTasks = asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query;

    const tasks = await Task.getCompletedTasks(req.user.id, parseInt(limit));

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

const getStats = asyncHandler(async (req, res) => {
    const stats = await Task.getStats(req.user.id);

    const today = new Date();
    const weekData = [];

    const completedTasks = await Task.getCompletedTasks(req.user.id, 1000);
    const allTasks = await Task.findAll(req.user.id);

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayStart = new Date(dateString);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateString);
        dayEnd.setHours(23, 59, 59, 999);

        const completed = completedTasks.filter(task => {
            if (!task.completedAt) return false;
            const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
            return completedDate === dateString;
        }).length;

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

const getCalendarTasks = asyncHandler(async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({
            success: false,
            message: 'Start and end dates are required'
        });
    }

    const tasks = await Task.getCalendarTasks(req.user.id, start, end);

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

const getTasksByRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: 'Start date and end date are required'
        });
    }

    const tasks = await Task.getCalendarTasks(req.user.id, startDate, endDate);

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

const createTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, time, priority, category, reminderEnabled } = req.body;

    const allTasks = await Task.findAll(req.user.id);
    const order = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order || 0)) + 1 : 0;

    const newTask = await Task.create({
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

const updateTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, time, priority, status, category, reminderEnabled } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

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

    task = await Task.update(req.params.id, updateData);

    res.json({
        success: true,
        message: 'Task updated successfully',
        data: { task }
    });
});

const toggleComplete = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    const updatedTask = await Task.toggleComplete(req.params.id);

    res.json({
        success: true,
        message: `Task marked as ${updatedTask.status}`,
        data: { task: updatedTask }
    });
});

const reorderTasks = asyncHandler(async (req, res) => {
    const { taskOrders } = req.body;

    if (!taskOrders || !Array.isArray(taskOrders)) {
        return res.status(400).json({
            success: false,
            message: 'taskOrders array is required'
        });
    }

    for (const { id, order } of taskOrders) {
        await Task.update(id, { order });
    }

    res.json({
        success: true,
        message: 'Tasks reordered successfully'
    });
});

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
        const task = await Task.findById(id);
        if (task && task.userId === req.user.id) {
            await Task.update(id, updates);
            modifiedCount++;
        }
    }

    res.json({
        success: true,
        message: `${modifiedCount} tasks updated`,
        data: { modifiedCount }
    });
});

const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task || task.userId !== req.user.id) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    await Task.delete(req.params.id);

    res.json({
        success: true,
        message: 'Task deleted successfully'
    });
});

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
        const task = await Task.findById(id);
        if (task && task.userId === req.user.id) {
            await Task.delete(id);
            deletedCount++;
        }
    }

    res.json({
        success: true,
        message: `${deletedCount} tasks deleted`,
        data: { deletedCount }
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