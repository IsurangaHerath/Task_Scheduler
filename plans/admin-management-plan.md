# Admin Management System - Implementation Plan

## Executive Summary

This document outlines a comprehensive implementation plan for adding an Admin Management System to the TaskFlow application. The system extends the existing user model with roles and status, implements automatic admin account creation, provides an admin dashboard with user management capabilities, and secures admin routes with role-based access control (RBAC).

---

## 1. Database Schema Changes

### 1.1 Users Table Modification

The `users` table requires two new columns to support the admin functionality:

```sql
-- Add to existing users table (migration)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'));
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled'));
```

### 1.2 Updated Table Structure

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
    settings TEXT DEFAULT '{"notifications":{"email":true,"browser":true},"theme":"light","reminderTime":15}',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);
```

### 1.3 Database Initialization Updates

**File:** `server/config/db.js`

Add migration logic in `initializeDatabase()` to:
1. Check if `role` column exists, if not add it
2. Check if `status` column exists, if not add it
3. Create index on role and status for faster queries

```javascript
// Migration helper function
const runMigrations = () => {
    // Check if role column exists
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes('role')) {
        db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'))");
    }
    
    if (!columns.includes('status')) {
        db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled'))");
    }
    
    // Create indexes for admin queries
    db.exec("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)");
};
```

---

## 2. Backend API Routes and Controllers

### 2.1 New Admin Routes File

**File:** `server/routes/adminRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/stats', adminController.getUserStats);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Activity Overview
router.get('/activity', adminController.getActivityOverview);

module.exports = router;
```

### 2.2 Admin Controller

**File:** `server/controllers/adminController.js`

```javascript
const User = require('../models/User');
const Task = require('../models/Task');
const WeeklyTask = require('../models/WeeklyTask');
const { db } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

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
    getActivityOverview
};
```

---

## 3. Security Middleware

### 3.1 Updated Auth Middleware

**File:** `server/middleware/auth.js`

Add the `authorize` function to the existing middleware:

```javascript
/**
 * Authorize specific roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized - No token provided'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized - Insufficient permissions'
            });
        }
        
        next();
    };
};
```

### 3.2 Protect Middleware Update

Update the `protect` middleware to check user status:

```javascript
exports.protect = async (req, res, next) => {
    // ... existing token validation code ...
    
    // Check if user is active
    if (user.status === 'disabled') {
        return res.status(403).json({
            success: false,
            message: 'Account is disabled. Contact administrator.'
        });
    }
    
    // Add user to request object
    req.user = user;
    next();
};
```

---

## 4. Default Admin Account Creation

### 4.1 Admin Service

**File:** `server/services/adminService.js`

```javascript
const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const User = require('../models/User');

const DEFAULT_ADMIN_EMAIL = 'admin@taskflow.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

/**
 * Create default admin account if no admin exists
 */
const createDefaultAdmin = async () => {
    try {
        // Check if any admin exists
        const adminExists = db.prepare(
            "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
        ).get().count;
        
        if (adminExists > 0) {
            console.log('✅ Admin account already exists');
            return;
        }
        
        // Check if default admin email already exists as regular user
        const existingUser = User.findByEmail(DEFAULT_ADMIN_EMAIL);
        
        if (existingUser) {
            // Upgrade to admin
            await User.update(existingUser.id, { role: 'admin', status: 'active' });
            console.log('✅ Existing user upgraded to admin');
            return;
        }
        
        // Create new admin account
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);
        
        db.prepare(`
            INSERT INTO users (name, email, password, role, status)
            VALUES (?, ?, ?, 'admin', 'active')
        `).run('Admin', DEFAULT_ADMIN_EMAIL.toLowerCase(), hashedPassword);
        
        console.log('✅ Default admin account created');
        console.log(`   Email: ${DEFAULT_ADMIN_EMAIL}`);
        console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);
        console.log('   ⚠️  Please change the default password after first login!');
        
    } catch (error) {
        console.error('❌ Error creating default admin:', error.message);
    }
};

module.exports = { createDefaultAdmin };
```

### 4.2 Server Initialization Update

**File:** `server/server.js`

```javascript
const { createDefaultAdmin } = require('./services/adminService');

// After database initialization
initializeDatabase();

// Create default admin account
createDefaultAdmin();
```

---

## 5. User Model Updates

### 5.1 Updated User Model

**File:** `server/models/User.js`

Add role and status to the allowed update fields:

```javascript
static async create(userData) {
    const { name, email, password, role, status } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const stmt = db.prepare(`
        INSERT INTO users (name, email, password, role, status)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
        name, 
        email.toLowerCase(), 
        hashedPassword,
        role || 'user',
        status || 'active'
    );
    return this.findById(result.lastInsertRowid);
}

static async update(id, updateData) {
    const allowedFields = ['name', 'email', 'avatar', 'settings', 'role', 'status'];
    // ... rest of update logic
}
```

---

## 6. Frontend Implementation

### 6.1 Admin API Service

**File:** `client/src/services/adminService.js`

```javascript
import api from './api';

const adminService = {
    // Get all users
    getUsers: (page = 1, limit = 20) => 
        api.get(`/admin/users?page=${page}&limit=${limit}`),
    
    // Get user stats
    getUserStats: () => 
        api.get('/admin/users/stats'),
    
    // Get user by ID
    getUser: (id) => 
        api.get(`/admin/users/${id}`),
    
    // Update user status
    updateUserStatus: (id, status) => 
        api.put(`/admin/users/${id}/status`, { status }),
    
    // Update user role
    updateUserRole: (id, role) => 
        api.put(`/admin/users/${id}/role`, { role }),
    
    // Delete user
    deleteUser: (id) => 
        api.delete(`/admin/users/${id}`),
    
    // Get activity overview
    getActivity: () => 
        api.get('/admin/activity')
};

export default adminService;
```

### 6.2 Auth Context Updates

**File:** `client/src/context/AuthContext.jsx`

Add role checking helper:

```javascript
// Add to value object
const value = {
    // ... existing properties
    isAdmin: user?.role === 'admin',
    isActive: user?.status === 'active',
    canAccessAdmin: user?.role === 'admin' && user?.status === 'active'
};
```

### 6.3 Admin Dashboard Page

**File:** `client/src/pages/AdminDashboard.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsRes, activityRes] = await Promise.all([
                adminService.getUserStats(),
                adminService.getActivity()
            ]);
            setStats(statsRes.data.data);
            setActivity(activityRes.data.data);
        } catch (error) {
            toast.error('Failed to load admin dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p className="stat-value">{stats?.totalUsers || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Active Users</h3>
                    <p className="stat-value">{stats?.activeUsers || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Disabled Users</h3>
                    <p className="stat-value">{stats?.disabledUsers || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Tasks</h3>
                    <p className="stat-value">{stats?.totalTasks || 0}</p>
                </div>
            </div>

            {/* Weekly Activity */}
            <div className="activity-section">
                <h2>Weekly Activity</h2>
                <div className="activity-stats">
                    <div>
                        <span>Tasks Created</span>
                        <strong>{activity?.summary?.tasksCreatedLastWeek || 0}</strong>
                    </div>
                    <div>
                        <span>Tasks Completed</span>
                        <strong>{activity?.summary?.tasksCompletedLastWeek || 0}</strong>
                    </div>
                    <div>
                        <span>New Users</span>
                        <strong>{activity?.summary?.newUsersLastWeek || 0}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
```

### 6.4 User Management Page

**File:** `client/src/pages/AdminUsers.jsx`

```jsx
import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';
import { Users, Search, Trash2, Shield, ShieldOff, ToggleLeft, ToggleRight } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, [pagination.page]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await adminService.getUsers(pagination.page);
            setUsers(response.data.data.users);
            setPagination(response.data.data.pagination);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        try {
            await adminService.updateUserStatus(userId, newStatus);
            toast.success(`User ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await adminService.updateUserRole(userId, newRole);
            toast.success(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'}`);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        try {
            await adminService.deleteUser(userId);
            toast.success('User deleted successfully');
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-users">
            <div className="page-header">
                <h1>User Management</h1>
                <div className="search-box">
                    <Search className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="avatar">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{user.name}</span>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`badge badge-${user.role}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge badge-${user.status}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            onClick={() => handleRoleChange(user.id, user.role)}
                                            className="btn-icon"
                                            title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                        >
                                            {user.role === 'admin' ? <ShieldOff /> : <Shield />}
                                        </button>
                                        <button 
                                            onClick={() => handleStatusToggle(user.id, user.status)}
                                            className="btn-icon"
                                            title={user.status === 'active' ? 'Disable user' : 'Enable user'}
                                        >
                                            {user.status === 'active' ? <ToggleRight /> : <ToggleLeft />}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user.id)}
                                            className="btn-icon btn-danger"
                                            title="Delete user"
                                        >
                                            <Trash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="pagination">
                    <button 
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                        Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.pages}</span>
                    <button 
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
```

---

## 7. Sidebar Integration

### 7.1 Updated Sidebar Component

**File:** `client/src/components/common/Sidebar.jsx`

```javascript
import { Shield } from 'lucide-react';

// Add admin link to navItems conditionally
const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/today', icon: CheckSquare, label: "Today's Tasks" },
    { path: '/weekly-tracker', icon: CalendarDays, label: 'Weekly Tracker' },
    { path: '/upcoming', icon: Clock, label: 'Upcoming' },
    { path: '/completed', icon: CheckCircle2, label: 'Completed' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

// Add admin section before settings if user is admin
{user?.role === 'admin' && (
    <>
        <div className="sidebar-divider" />
        <div className="sidebar-section-title">Admin</div>
        <NavLink
            to="/admin"
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
        >
            <Shield className="w-5 h-5" />
            <span>Admin Panel</span>
        </NavLink>
    </>
)}
```

---

## 8. App Routes Update

### 8.1 Updated App.jsx

**File:** `client/src/App.jsx`

```javascript
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';

// Admin Route wrapper
const AdminRoute = ({ children }) => {
    const { user } = useAuth();
    
    if (user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

// Add routes
<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
    {/* Existing routes */}
    <Route path="/dashboard" element={<Dashboard />} />
    
    {/* Admin routes */}
    <Route element={<AdminRoute><Layout /></AdminRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
    </Route>
</Route>
```

---

## 9. Server Routes Registration

### 9.1 Updated server.js

```javascript
const adminRoutes = require('./routes/adminRoutes');

// Add routes
app.use('/api/admin', adminRoutes);
```

---

## 10. Implementation Steps Summary

### Phase 1: Backend Foundation
1. Update `server/config/db.js` - Add migration logic for role/status columns
2. Update `server/models/User.js` - Add role and status to create/update methods
3. Update `server/middleware/auth.js` - Add authorize middleware and status check

### Phase 2: Admin API
4. Create `server/routes/adminRoutes.js` - Define admin routes
5. Create `server/controllers/adminController.js` - Implement admin controllers
6. Create `server/services/adminService.js` - Default admin creation logic
7. Create `server/services/sessionService.js` - User session tracking (logged-in status)
8. Update `server/server.js` - Register admin routes and initialize admin

### Phase 3: Frontend Core
9. Create `client/src/services/adminService.js` - API service
10. Update `client/src/context/AuthContext.jsx` - Add admin helpers

### Phase 4: Admin UI
11. Create `client/src/pages/AdminDashboard.jsx` - Admin dashboard
12. Create `client/src/pages/AdminUsers.jsx` - User management
13. Create `client/src/pages/AdminSessions.jsx` - Manage currently logged-in users
14. Update `client/src/App.jsx` - Add admin routes
15. Update `client/src/components/common/Sidebar.jsx` - Add admin menu

---

## 11. API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/admin/users | Admin | Get all users (paginated) |
| GET | /api/admin/users/stats | Admin | Get user statistics |
| GET | /api/admin/users/:id | Admin | Get specific user |
| PUT | /api/admin/users/:id/status | Admin | Enable/disable user |
| PUT | /api/admin/users/:id/role | Admin | Promote/demote user |
| DELETE | /api/admin/users/:id | Admin | Delete user |
| GET | /api/admin/sessions | Admin | Get all currently logged-in users |
| DELETE | /api/admin/sessions/:userId | Admin | Force logout a user |
| GET | /api/admin/activity | Admin | Get activity overview |

---

## 11. User Session Management (Logged-in Users)

The admin can view and manage all currently logged-in users. This feature tracks user sessions and allows admins to force-logout users if needed.

### 11.1 Session Tracking Service

**File:** `server/services/sessionService.js`

```javascript
const { db } = require('../config/db');

// In-memory session store
const activeSessions = new Map();

const trackSession = (userId, token, expiresAt) => {
    activeSessions.set(userId, {
        userId,
        token,
        expiresAt,
        lastActive: new Date().toISOString()
    });
};

const removeSession = (userId) => {
    activeSessions.delete(userId);
};

const getActiveSessions = () => {
    const sessions = [];
    const now = new Date();
    
    for (const [userId, session] of activeSessions) {
        if (new Date(session.expiresAt) > now) {
            const user = db.prepare(`
                SELECT id, name, email, role FROM users WHERE id = ?
            `).get(userId);
            
            sessions.push({ ...session, user: user || null });
        }
    }
    
    return sessions;
};

const forceLogoutUser = (userId) => {
    const existed = activeSessions.has(userId);
    activeSessions.delete(userId);
    return existed;
};

const isUserLoggedIn = (userId) => {
    const session = activeSessions.get(userId);
    if (!session) return false;
    return new Date(session.expiresAt) > new Date();
};

module.exports = { trackSession, removeSession, getActiveSessions, forceLogoutUser, isUserLoggedIn };
```

### 11.2 Session Management Endpoints

Add to `server/routes/adminRoutes.js`:
```javascript
router.get('/sessions', adminController.getActiveSessions);
router.delete('/sessions/:userId', adminController.forceLogoutUser);
```

### 11.3 Admin Sessions Page

**File:** `client/src/pages/AdminSessions.jsx` - Display currently logged-in users with force logout capability.

### 11.4 Updated Admin Service

Add to `client/src/services/adminService.js`:
```javascript
getActiveSessions: () => api.get('/admin/sessions'),
forceLogoutUser: (userId) => api.delete(`/admin/sessions/${userId}`),
```

---

## 12. Security Considerations

1. **Password Storage**: Default admin password is hashed using bcrypt
2. **Role Validation**: All admin routes check for admin role
3. **Self-Protection**: Admin cannot disable or delete their own account
4. **Status Check**: Disabled users cannot login
5. **JWT Security**: Token includes user ID, role validated on each request

---

## 13. Testing Checklist

- [ ] Default admin created on first start
- [ ] Admin can login with default credentials
- [ ] Admin sees admin menu in sidebar
- [ ] Non-admin users cannot access /admin routes
- [ ] Admin can view all users
- [ ] Admin can enable/disable users
- [ ] Admin can promote/demote users
- [ ] Admin can delete users
- [ ] Admin can view currently logged-in users
- [ ] Admin can force logout a user
- [ ] Activity overview shows correct stats
- [ ] Disabled users cannot login
