const express = require('express');
const router = express.Router();
const weeklyController = require('../controllers/weeklyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/tasks', weeklyController.getAllTasks);
router.get('/tasks-with-completions', weeklyController.getTasksWithCompletions);
router.get('/progress', weeklyController.getWeeklyProgress);
router.post('/tasks', weeklyController.createTask);
router.put('/tasks/:id', weeklyController.updateTask);
router.delete('/tasks/:id', weeklyController.deleteTask);
router.post('/tasks/:id/toggle', weeklyController.toggleCompletion);

module.exports = router;
