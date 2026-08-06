const WeeklyTask = require('../models/WeeklyTask');

const weeklyController = {
    // Function: getAllTasks
    // Triggered by: No current frontend caller (weeklyService.getAllTasks is defined but never used by any component)
    // Endpoint: GET /api/weekly/tasks
    // Purpose: Return all weekly tasks for the logged-in user
    // Input: Authorization Bearer token
    // Database: SELECTs weekly_tasks ordered by createdAt
    // Output: 200 with { success, data: { tasks } }; 500 on error
    // NOTE: Unused backend function - no frontend flow triggers this endpoint
    async getAllTasks(req, res) {
        try {
            const userId = req.user.id;
            const tasks = await WeeklyTask.findAll(userId);
            res.json({
                success: true,
                data: { tasks }
            });
        } catch (error) {
            console.error('Error getting weekly tasks:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Function: getTasksWithCompletions
    // Triggered by: WeeklyTaskTracker.jsx + WeeklyReport.jsx fetchData (week load/navigation) -> weeklyService.getTasksWithCompletions
    // Endpoint: GET /api/weekly/tasks-with-completions?weekStart=<date>
    // Purpose: Return weekly tasks each annotated with their per-day completion map for a given week
    // Input: Query param - weekStart (optional, defaults to current week Monday)
    // Database: SELECTs weekly_tasks and weekly_task_completions for the requested week
    // Output: 200 with { success, data: [ { ...task, completions: { dayIndex: { completed, completedAt } } } ] }; 500 on error
    async getTasksWithCompletions(req, res) {
        try {
            const userId = req.user.id;
            const { weekStart } = req.query;
            const tasks = await WeeklyTask.getCompletionsForWeek(userId, weekStart);
            res.json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error('Error getting weekly tasks with completions:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Function: createTask
    // Triggered by: WeeklyTaskTracker.jsx handleAddTask (Add Task form submit) -> weeklyService.createTask
    // Endpoint: POST /api/weekly/tasks
    // Purpose: Create a new recurring weekly task
    // Input: body - name (task label)
    // Database: INSERTs into weekly_tasks table
    // Output: 201 with { success, data: { task } }; 400 if name empty; 500 on error
    async createTask(req, res) {
        try {
            const userId = req.user.id;
            const { name } = req.body;
            
            if (!name || name.trim() === '') {
                return res.status(400).json({ success: false, message: 'Task name is required' });
            }
            
            const task = await WeeklyTask.create({
                userId,
                name: name.trim()
            });
            
            res.status(201).json({
                success: true,
                data: { task }
            });
        } catch (error) {
            console.error('Error creating weekly task:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Function: updateTask
    // Triggered by: No current frontend caller (weeklyService.updateTask is defined but no component offers a rename action)
    // Endpoint: PUT /api/weekly/tasks/:id
    // Purpose: Rename an existing weekly task
    // Input: URL param - id; body - name
    // Database: SELECTs weekly_task to verify ownership; UPDATEs weekly_tasks name
    // Output: 200 with { success, data: { task } }; 404 if not found/owned; 400 if name empty; 500 on error
    // NOTE: Unused backend function - no frontend flow triggers this endpoint
    async updateTask(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            
            const task = await WeeklyTask.findById(id);
            if (!task || task.userId !== req.user.id) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }
            
            if (!name || name.trim() === '') {
                return res.status(400).json({ success: false, message: 'Task name is required' });
            }
            
            const updatedTask = await WeeklyTask.update(id, { name: name.trim() });
            
            res.json({
                success: true,
                data: { task: updatedTask }
            });
        } catch (error) {
            console.error('Error updating weekly task:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Function: deleteTask
    // Triggered by: WeeklyTaskTracker.jsx handleDeleteTask (delete icon) -> weeklyService.deleteTask
    // Endpoint: DELETE /api/weekly/tasks/:id
    // Purpose: Delete a weekly task (and its completions via cascade)
    // Input: URL param - id
    // Database: SELECTs weekly_task to verify ownership; DELETEs weekly_tasks row
    // Output: 200 with { success, message }; 404 if not found/owned; 500 on error
    async deleteTask(req, res) {
        try {
            const { id } = req.params;
            
            const task = await WeeklyTask.findById(id);
            if (!task || task.userId !== req.user.id) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }
            
            await WeeklyTask.delete(id);
            
            res.json({
                success: true,
                message: 'Task deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting weekly task:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Function: toggleCompletion
    // Triggered by: WeeklyTaskTracker.jsx handleToggleDay (day checkbox click) -> weeklyService.toggleCompletion
    // Endpoint: POST /api/weekly/tasks/:id/toggle
    // Purpose: Toggle a task's completion for a specific day of the current week
    // Input: URL param - id; body - dayOfWeek (0-6), weekStart
    // Database: SELECTs weekly_task to verify ownership; SELECTs/INSERTs/UPDATEs weekly_task_completions row
    // Output: 200 with { success, data: { completed, completedAt } }; 400 for invalid day; 404 if not found/owned; 500 on error
    async toggleCompletion(req, res) {
        try {
            const { id } = req.params;
            const { dayOfWeek, weekStart } = req.body;
            
            const task = await WeeklyTask.findById(id);
            if (!task || task.userId !== req.user.id) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }
            
            if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
                return res.status(400).json({ success: false, message: 'Valid day of week (0-6) is required' });
            }
            
            const result = await WeeklyTask.toggleCompletion(id, dayOfWeek, weekStart);
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error toggling completion:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Function: getWeeklyProgress
    // Triggered by: WeeklyTaskTracker.jsx + WeeklyReport.jsx fetchData (week load/navigation) -> weeklyService.getWeeklyProgress
    // Endpoint: GET /api/weekly/progress?weekStart=<date>
    // Purpose: Compute the user's weekly completion/missed totals and completion rate
    // Input: Query param - weekStart (optional, defaults to current week Monday)
    // Database: SELECTs weekly_tasks; aggregate SUM query on weekly_task_completions for the week
    // Output: 200 with { success, data: { completed, missed, total, completionRate } }; 500 on error
    async getWeeklyProgress(req, res) {
        try {
            const userId = req.user.id;
            const { weekStart } = req.query;
            const progress = await WeeklyTask.getWeeklyProgress(userId, weekStart);
            res.json({
                success: true,
                data: progress
            });
        } catch (error) {
            console.error('Error getting weekly progress:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = weeklyController;