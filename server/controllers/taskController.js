const Task = require('../models/Task');
const { asyncHandler } = require('../middleware/errorHandler');

// Function: getTasks
// Triggered by: TaskContext.fetchTasks (refreshAll on Dashboard/auth) -> taskService.getTasks
// Endpoint: GET /api/tasks
// Purpose: Fetch the logged-in user's tasks with optional filters
// Input: Query params - status, priority, category, search, limit
// Database: SELECTs tasks from tasks table filtered by userId and optional filters; search filtered in memory
// Output: 200 with { success, count, data: { tasks } }
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

// Function: getTask
// Triggered by: No current frontend caller (taskService.getTask is defined but never used by any component)
// Endpoint: GET /api/tasks/:id
// Purpose: Fetch a single task by ID, ensuring it belongs to the logged-in user
// Input: URL param - id
// Database: SELECTs task from tasks table by id
// Output: 200 with { success, data: { task } }; 404 if not found or not owned by user
// NOTE: Unused backend function - no frontend flow triggers this endpoint
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

// Function: getTodayTasks
// Triggered by: TodayTasks.jsx mount + TaskContext.fetchTodayTasks (refreshAll) -> taskService.getTodayTasks
// Endpoint: GET /api/tasks/today
// Purpose: Fetch the logged-in user's tasks due today
// Input: Authorization Bearer token
// Database: SELECTs tasks from tasks table where dueDate = today
// Output: 200 with { success, count, data: { tasks } }
const getTodayTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.getTodayTasks(req.user.id);

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

// Function: getUpcomingTasks
// Triggered by: UpcomingTasks.jsx mount + TaskContext.fetchUpcomingTasks (refreshAll) -> taskService.getUpcomingTasks
// Endpoint: GET /api/tasks/upcoming?days=7
// Purpose: Fetch pending tasks with a due date after today, optionally filtered by a day window
// Input: Query param - days (default 7)
// Database: SELECTs pending tasks from tasks table with dueDate > today
// Output: 200 with { success, count, data: { tasks } }
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

// Function: getCompletedTasks
// Triggered by: CompletedTasks.jsx mount + TaskContext.fetchCompletedTasks (refreshAll) -> taskService.getCompletedTasks
// Endpoint: GET /api/tasks/completed?limit=50
// Purpose: Fetch the logged-in user's completed tasks, most recent first
// Input: Query param - limit (default 50)
// Database: SELECTs completed tasks from tasks table ordered by completedAt DESC
// Output: 200 with { success, count, data: { tasks } }
const getCompletedTasks = asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query;

    const tasks = await Task.getCompletedTasks(req.user.id, parseInt(limit));

    res.json({
        success: true,
        count: tasks.length,
        data: { tasks }
    });
});

// Function: getStats
// Triggered by: Dashboard.jsx mount via TaskContext.refreshAll -> taskService.getStats
// Endpoint: GET /api/tasks/stats
// Purpose: Compute aggregate task statistics and 7-day productivity data for the dashboard
// Input: Authorization Bearer token
// Database: Multiple COUNT queries on tasks table (total, completed, pending, today, week, by priority)
// Output: 200 with { success, data: { stats, weekData } }
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

// Function: getCalendarTasks
// Triggered by: Calendar.jsx fetchEvents (view/navigation changes) -> TaskContext.getCalendarTasks -> taskService.getCalendarTasks
// Endpoint: GET /api/tasks/calendar?start=<date>&end=<date>
// Purpose: Fetch tasks within a date range for the calendar view
// Input: Query params - start, end (dates)
// Database: SELECTs tasks from tasks table where dueDate is BETWEEN start and end
// Output: 200 with { success, count, data: { tasks } }; 400 if start/end missing
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

// Function: getTasksByRange
// Triggered by: No current frontend caller (taskService.getTasksByRange is defined but never used by any component)
// Endpoint: GET /api/tasks/range?startDate=<date>&endDate=<date>
// Purpose: Fetch tasks within an arbitrary date range (used for date-range reports)
// Input: Query params - startDate, endDate
// Database: SELECTs tasks from tasks table where dueDate is BETWEEN startDate and endDate
// Output: 200 with { success, count, data: { tasks } }; 400 if dates missing
// NOTE: Unused backend function - no frontend flow triggers this endpoint
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

// Function: createTask
// Triggered by: TaskModal.jsx handleSubmit (create mode) -> TaskContext.createTask -> taskService.createTask
// Endpoint: POST /api/tasks
// Purpose: Create a new task for the logged-in user and assign the next sort order
// Input: title, description, dueDate, time, priority, category, reminderEnabled (JSON body)
// Database: SELECTs existing tasks to compute order; INSERTs new row into tasks table
// Output: 201 with { success, message, data: { task } }
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

// Function: updateTask
// Triggered by: TaskModal.jsx handleSubmit (edit mode) -> TaskContext.updateTask -> taskService.updateTask
// Endpoint: PUT /api/tasks/:id
// Purpose: Update editable fields of an existing task (sets completedAt when marked complete)
// Input: URL param - id; body - title, description, dueDate, time, priority, status, category, reminderEnabled
// Database: SELECTs task to verify ownership; UPDATEs tasks row
// Output: 200 with { success, message, data: { task } }; 404 if not found or not owned by user
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

// Function: toggleComplete
// Triggered by: TaskCard.jsx handleToggleComplete (completion circle click) -> TaskContext.toggleComplete -> taskService.toggleComplete
// Endpoint: PATCH /api/tasks/:id/complete
// Purpose: Toggle a task between pending and completed status
// Input: URL param - id
// Database: SELECTs task to verify ownership; UPDATEs tasks row status and completedAt
// Output: 200 with { success, message, data: { task } }; 404 if not found or not owned by user
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

// Function: reorderTasks
// Triggered by: No current frontend caller (TaskContext.reorderTasks exists but no component performs drag & drop)
// Endpoint: PUT /api/tasks/reorder
// Purpose: Persist the new sort order of tasks after drag-and-drop
// Input: body - taskOrders (array of { id, order })
// Database: UPDATEs "order" column for each task id
// Output: 200 with { success, message }; 400 if taskOrders is not an array
// NOTE: Unused backend function - no frontend flow triggers this endpoint
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

// Function: bulkUpdate
// Triggered by: No current frontend caller (TaskContext.bulkUpdate is defined but never invoked by any component)
// Endpoint: PUT /api/tasks/bulk
// Purpose: Apply the same update to multiple tasks at once
// Input: body - taskIds (array), updates (object of fields to change)
// Database: SELECTs each task to verify ownership; UPDATEs each owned tasks row
// Output: 200 with { success, message, data: { modifiedCount } }; 400 if taskIds missing
// NOTE: Unused backend function - no frontend flow triggers this endpoint
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

// Function: deleteTask
// Triggered by: TaskCard.jsx handleDelete (menu delete + confirm) -> TaskContext.deleteTask -> taskService.deleteTask
// Endpoint: DELETE /api/tasks/:id
// Purpose: Delete a single task belonging to the logged-in user
// Input: URL param - id
// Database: SELECTs task to verify ownership; DELETEs tasks row
// Output: 200 with { success, message }; 404 if not found or not owned by user
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

// Function: bulkDelete
// Triggered by: No current frontend caller (TaskContext.bulkDelete is defined but never invoked by any component)
// Endpoint: DELETE /api/tasks/bulk
// Purpose: Delete multiple tasks at once
// Input: body - taskIds (array)
// Database: SELECTs each task to verify ownership; DELETEs each owned tasks row
// Output: 200 with { success, message, data: { deletedCount } }; 400 if taskIds missing
// NOTE: Unused backend function - no frontend flow triggers this endpoint
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