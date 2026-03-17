const User = require('../models/User');
const Task = require('../models/Task');
const { db } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const sessionService = require('../services/sessionService');

/**
 * @desc    Get all users (paginated)
 * @route   GET /api/admin/users
 * @access  Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const users = db.prepare(`
        SELECT id, name, email, role, status, createdAt, updatedAt
        FROM users
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    
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

/**
 * @desc    Get user statistics
 * @route   GET /api/admin/users/stats
 * @access  Admin
 */
const getUserStats = asyncHandler(async (req, res) => {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count;
    const disabledUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'disabled'").get().count;
    const adminUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    const regularUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
    
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    
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

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Admin
 */
const getUserById = asyncHandler(async (req, res) => {
    const user = User.findById(req.params.id);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    // Get user's task stats
    const taskStats = Task.getStats(req.params.id);
    
    res.json({
        success: true,
        data: { user, taskStats }
    });
});

/**
 * @desc    Update user status (active/disabled)
 * @route   PUT /api/admin/users/:id/status
 * @access  Admin
 */
const updateUserStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    if (!['active', 'disabled'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value'
        });
    }
    
    const user = User.findById(req.params.id);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    // Prevent admin from disabling themselves
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

/**
 * @desc    Update user role (promote/demote)
 * @route   PUT /api/admin/users/:id/role
 * @access  Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role value'
        });
    }
    
    const user = User.findById(req.params.id);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    // Prevent admin from demoting themselves
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

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete your own account'
        });
    }
    
    const user = User.findById(userId);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    // Delete user's tasks and data
    db.prepare('DELETE FROM weekly_task_completions WHERE weeklyTaskId IN (SELECT id FROM weekly_tasks WHERE userId = ?)').run(userId);
    db.prepare('DELETE FROM weekly_tasks WHERE userId = ?').run(userId);
    db.prepare('DELETE FROM tasks WHERE userId = ?').run(userId);
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(userId);
    
    // Delete user
    await User.delete(userId);
    
    res.json({
        success: true,
        message: 'User deleted successfully'
    });
});

/**
 * @desc    Get all currently logged-in users
 * @route   GET /api/admin/sessions
 * @access  Admin
 */
const getActiveSessions = asyncHandler(async (req, res) => {
    const sessions = sessionService.getActiveSessions();
    
    res.json({
        success: true,
        data: { sessions }
    });
});

/**
 * @desc    Force logout a specific user
 * @route   DELETE /api/admin/sessions/:userId
 * @access  Admin
 */
const forceLogoutUser = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    // Prevent admin from forcing their own logout
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

/**
 * @desc    Get activity overview with weekly stats
 * @route   GET /api/admin/activity
 * @access  Admin
 */
const getActivityOverview = asyncHandler(async (req, res) => {
    // Get date range for last 7 days
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    // Tasks created in last 7 days
    const tasksCreatedLastWeek = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE date(createdAt) BETWEEN date(?) AND date(?)
    `).get(weekAgoStr, todayStr).count;
    
    // Tasks completed in last 7 days
    const tasksCompletedLastWeek = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE status = 'completed'
        AND date(completedAt) BETWEEN date(?) AND date(?)
    `).get(weekAgoStr, todayStr).count;
    
    // Daily activity for the last 7 days
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const tasksCreated = db.prepare(`
            SELECT COUNT(*) as count FROM tasks
            WHERE date(createdAt) = date(?)
        `).get(dateStr).count;
        
        const tasksCompleted = db.prepare(`
            SELECT COUNT(*) as count FROM tasks
            WHERE status = 'completed' AND date(completedAt) = date(?)
        `).get(dateStr).count;
        
        const newUsers = db.prepare(`
            SELECT COUNT(*) as count FROM users
            WHERE date(createdAt) = date(?)
        `).get(dateStr).count;
        
        dailyActivity.push({
            date: dateStr,
            tasksCreated,
            tasksCompleted,
            newUsers
        });
    }
    
    // Users registered in last 7 days
    const newUsersLastWeek = db.prepare(`
        SELECT COUNT(*) as count FROM users
        WHERE date(createdAt) BETWEEN date(?) AND date(?)
    `).get(weekAgoStr, todayStr).count;
    
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
