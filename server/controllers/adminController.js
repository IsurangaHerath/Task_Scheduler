const User = require('../models/User');
const Task = require('../models/Task');
const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const sessionService = require('../services/sessionService');

// Function: getAllUsers
// Triggered by: AdminUsers.jsx loadUsers (page load / pagination change) -> adminService.getUsers
// Endpoint: GET /api/admin/users?page=<n>&limit=<n>
// Purpose: Return a paginated list of all users for the admin panel
// Input: Query params - page (default 1), limit (default 20)
// Database: SELECTs users ordered by createdAt DESC with LIMIT/OFFSET; COUNT(*) for total
// Output: 200 with { success, data: { users, pagination } }
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

// Function: getUserStats
// Triggered by: AdminDashboard.jsx loadDashboardData (page load) -> adminService.getUserStats
// Endpoint: GET /api/admin/users/stats
// Purpose: Return aggregate user/task counts for the admin dashboard stat cards
// Input: Authorization Bearer token (admin)
// Database: Parallel COUNT queries on users and tasks tables (total, active, disabled, admin, user, tasks)
// Output: 200 with { success, data: { totalUsers, activeUsers, disabledUsers, adminUsers, regularUsers, totalTasks } }
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

// Function: getUserById
// Triggered by: No current frontend caller (AdminUsers.jsx defines handleViewUser but no UI element invokes it)
// Endpoint: GET /api/admin/users/:id
// Purpose: Return a single user's details along with their task statistics
// Input: URL param - id
// Database: SELECTs user by id; Task.getStats for the user's task counts
// Output: 200 with { success, data: { user, taskStats } }; 404 if user not found
// NOTE: Unused backend function - no frontend flow triggers this endpoint
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

// Function: updateUserStatus
// Triggered by: AdminUsers.jsx handleStatusToggle (enable/disable toggle button) -> adminService.updateUserStatus
// Endpoint: PUT /api/admin/users/:id/status
// Purpose: Enable or disable a user's account (disabled users cannot log in)
// Input: URL param - id; body - status ('active' | 'disabled')
// Database: SELECTs user by id; UPDATEs users status column
// Output: 200 with { success, message, data: { user } }; 400 for invalid status or self-disable; 404 if not found
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

// Function: updateUserRole
// Triggered by: AdminUsers.jsx handleRoleChange (promote/demote shield button) -> adminService.updateUserRole
// Endpoint: PUT /api/admin/users/:id/role
// Purpose: Promote a user to admin or demote an admin back to user
// Input: URL param - id; body - role ('user' | 'admin')
// Database: SELECTs user by id; UPDATEs users role column
// Output: 200 with { success, message, data: { user } }; 400 for invalid role or self-demotion; 404 if not found
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

// Function: deleteUser
// Triggered by: AdminUsers.jsx handleDelete (delete button + confirm) -> adminService.deleteUser
// Endpoint: DELETE /api/admin/users/:id
// Purpose: Permanently delete a user along with all related data (tasks, weekly tasks, reset tokens)
// Input: URL param - id
// Database: DELETEs weekly_task_completions, weekly_tasks, tasks, password_reset_tokens, then users row
// Output: 200 with { success, message }; 400 for self-deletion; 404 if user not found
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

// Function: getActiveSessions
// Triggered by: AdminSessions.jsx loadSessions (page load / Refresh button) -> adminService.getActiveSessions
// Endpoint: GET /api/admin/sessions
// Purpose: List all currently active user sessions with user details
// Input: Authorization Bearer token (admin)
// Database: Reads in-memory sessionService map; SELECTs user info from users for each active session
// Output: 200 with { success, data: { sessions } }
const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.getActiveSessions();
  
  res.json({
    success: true,
    data: { sessions }
  });
});

// Function: forceLogoutUser
// Triggered by: AdminSessions.jsx handleForceLogout ("Force Logout" button + confirm) -> adminService.forceLogoutUser
// Endpoint: DELETE /api/admin/sessions/:userId
// Purpose: Terminate a user's active session server-side
// Input: URL param - userId
// Database: No DB query; removes session from in-memory sessionService map
// Output: 200 with { success, message }; 400 for self-logout; 404 if no active session found
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

// Function: getActivityOverview
// Triggered by: AdminDashboard.jsx loadDashboardData (page load) -> adminService.getActivity
// Endpoint: GET /api/admin/activity
// Purpose: Return 7-day activity summary (tasks created/completed, new users) and daily breakdown
// Input: Authorization Bearer token (admin)
// Database: Parallel COUNT queries on tasks and users tables filtered by date ranges
// Output: 200 with { success, data: { summary, dailyActivity } }; 500 on query failure
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