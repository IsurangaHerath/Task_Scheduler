const WeeklyTask = require('../models/WeeklyTask');

const weeklyController = {
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