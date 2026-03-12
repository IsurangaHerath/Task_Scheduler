const WeeklyTask = require('../models/WeeklyTask');

const weeklyController = {
    getAllTasks(req, res) {
        try {
            const userId = req.user.id;
            const tasks = WeeklyTask.findAll(userId);
            res.json(tasks);
        } catch (error) {
            console.error('Error getting weekly tasks:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getTasksWithCompletions(req, res) {
        try {
            const userId = req.user.id;
            const { weekStart } = req.query;
            const tasks = WeeklyTask.getCompletionsForWeek(userId, weekStart);
            res.json(tasks);
        } catch (error) {
            console.error('Error getting weekly tasks with completions:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    createTask(req, res) {
        try {
            const userId = req.user.id;
            const { name } = req.body;
            
            if (!name || name.trim() === '') {
                return res.status(400).json({ message: 'Task name is required' });
            }
            
            const task = WeeklyTask.create({
                userId,
                name: name.trim()
            });
            
            res.status(201).json(task);
        } catch (error) {
            console.error('Error creating weekly task:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateTask(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            
            // Check if task exists and belongs to user
            const task = WeeklyTask.findById(id);
            if (!task || task.userId !== req.user.id) {
                return res.status(404).json({ message: 'Task not found' });
            }
            
            if (!name || name.trim() === '') {
                return res.status(400).json({ message: 'Task name is required' });
            }
            
            const updatedTask = WeeklyTask.update(id, { name: name.trim() });
            
            res.json(updatedTask);
        } catch (error) {
            console.error('Error updating weekly task:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteTask(req, res) {
        try {
            const { id } = req.params;
            
            // Check if task exists and belongs to user
            const task = WeeklyTask.findById(id);
            if (!task || task.userId !== req.user.id) {
                return res.status(404).json({ message: 'Task not found' });
            }
            
            const deleted = WeeklyTask.delete(id);
            
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error('Error deleting weekly task:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    toggleCompletion(req, res) {
        try {
            const { id } = req.params;
            const { dayOfWeek, weekStart } = req.body;
            
            // Check if task exists and belongs to user
            const task = WeeklyTask.findById(id);
            if (!task || task.userId !== req.user.id) {
                return res.status(404).json({ message: 'Task not found' });
            }
            
            if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
                return res.status(400).json({ message: 'Valid day of week (0-6) is required' });
            }
            
            const result = WeeklyTask.toggleCompletion(id, dayOfWeek, weekStart);
            res.json(result);
        } catch (error) {
            console.error('Error toggling completion:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getWeeklyProgress(req, res) {
        try {
            const userId = req.user.id;
            const { weekStart } = req.query;
            const progress = WeeklyTask.getWeeklyProgress(userId, weekStart);
            res.json(progress);
        } catch (error) {
            console.error('Error getting weekly progress:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = weeklyController;
