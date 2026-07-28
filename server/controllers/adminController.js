const User = require('../models/User');
const Task = require('../models/Task');
const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const sessionService = require('../services/sessionService');

const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const { rows: users } = await pool.query(
    `SELECT id, name, email, role, status, "createdAt", "updatedAt"
     FROM users
     ORDER BY "createdAt" DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  
  const { rows: countResult } = await pool.query('SELECT COUNT(*) as count FROM users');
  const total = parseInt(countResult[0].count);
  
  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

const getUserStats = asyncHandler(async (req, res) => {
  const results = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM users'),
    pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'active'"),
    pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'disabled'"),
    pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'"),
    pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'"),
    pool.query('SELECT COUNT(*) as count FROM tasks')
  ]);
  
  const totalUsers = parseInt(results[0].rows[0].count);
  const activeUsers = parseInt(results[1].rows[0].count);
  const disabledUsers = parseInt(results[2].rows[0].count);
  const adminUsers = parseInt(results[3].rows[0].count);
  const regularUsers = parseInt(results[4].rows[0].count);
  const totalTasks = parseInt(results[5].rows[0].count);
  
  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      disabledUsers,
      adminUsers,
      regularUsers,
      totalTasks
    }
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const taskStats = await Task.getStats(req.params.id);
  
  res.json({
    success: true,
    data: { user, taskStats }
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot disable your own account'
    });
  }
  
  const updatedUser = await User.update(req.params.id, { status });
  
  res.json({
    success: true,
    message: `User ${status === 'active' ? 'enabled' : 'disabled'} successfully`,
    data: { user: updatedUser }
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role value'
    });
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  if (parseInt(req.params.id) === req.user.id && user.role === 'admin' && role === 'user') {
    return res.status(400).json({
      success: false,
      message: 'Cannot demote your own admin account'
    });
  }
  
  const updatedUser = await User.update(req.params.id, { role });
  
  res.json({
    success: true,
    message: `User promoted to ${role} successfully`,
    data: { user: updatedUser }
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (userId === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }
  
  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  await pool.query('DELETE FROM weekly_task_completions WHERE "weeklyTaskId" IN (SELECT id FROM weekly_tasks WHERE "userId" = $1)', [userId]);
  await pool.query('DELETE FROM weekly_tasks WHERE "userId" = $1', [userId]);
  await pool.query('DELETE FROM tasks WHERE "userId" = $1', [userId]);
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
  
  await User.delete(userId);
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.getActiveSessions();
  
  res.json({
    success: true,
    data: { sessions }
  });
});

const forceLogoutUser = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  
  if (userId === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot force logout your own session'
    });
  }
  
  const success = sessionService.forceLogoutUser(userId);
  
  if (!success) {
    return res.status(404).json({
      success: false,
      message: 'No active session found for this user'
    });
  }
  
  res.json({
    success: true,
    message: 'User has been logged out successfully'
  });
});

const getActivityOverview = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    const results = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM tasks WHERE "createdAt"::date >= $1`, [weekAgoStr]),
      pool.query(`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed' AND "completedAt"::date >= $1`, [weekAgoStr])
    ]);
    
    const tasksCreatedLastWeek = parseInt(results[0].rows[0].count) || 0;
    const tasksCompletedLastWeek = parseInt(results[1].rows[0].count) || 0;
    
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayResults = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM tasks WHERE "createdAt"::date = $1', [dateStr]),
        pool.query('SELECT COUNT(*) as count FROM tasks WHERE status = \'completed\' AND "completedAt"::date = $1', [dateStr]),
        pool.query('SELECT COUNT(*) as count FROM users WHERE "createdAt"::date = $1', [dateStr])
      ]);
      
      dailyActivity.push({
        date: dateStr,
        tasksCreated: parseInt(dayResults[0].rows[0].count) || 0,
        tasksCompleted: parseInt(dayResults[1].rows[0].count) || 0,
        newUsers: parseInt(dayResults[2].rows[0].count) || 0
      });
    }
    
    const newUsersResult = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE "createdAt"::date >= $1`,
      [weekAgoStr]
    );
    const newUsersLastWeek = parseInt(newUsersResult.rows[0].count) || 0;
    
    res.json({
      success: true,
      data: {
        summary: {
          tasksCreatedLastWeek,
          tasksCompletedLastWeek,
          newUsersLastWeek
        },
        dailyActivity
      }
    });
  } catch (error) {
    console.error('Activity overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity data'
    });
  }
});

module.exports = {
  getAllUsers,
  getUserStats,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getActiveSessions,
  forceLogoutUser,
  getActivityOverview
};