const { db } = require('../config/db');

/**
 * Task Model for SQLite
 * Provides Mongoose-like interface for task operations
 */
class Task {
    /**
     * Create a new task
     * @param {Object} taskData - Task data
     * @returns {Object} Created task
     */
    static create(taskData) {
        const { userId, title, description, dueDate, time, priority, status, category, reminderEnabled, order } = taskData;
        
        const stmt = db.prepare(`
            INSERT INTO tasks (userId, title, description, dueDate, time, priority, status, category, reminderEnabled, "order")
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            userId,
            title,
            description || '',
            dueDate,
            time || '09:00',
            priority || 'medium',
            status || 'pending',
            category || 'general',
            reminderEnabled !== false ? 1 : 0,
            order || 0
        );
        
        return this.findById(result.lastInsertRowid);
    }

    /**
     * Find task by ID
     * @param {number} id - Task ID
     * @returns {Object|null} Task object
     */
    static findById(id) {
        const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
        const task = stmt.get(id);
        if (task) {
            return this._parseTask(task);
        }
        return null;
    }

    /**
     * Find all tasks for a user
     * @param {number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Array} Tasks array
     */
    static findAll(userId, options = {}) {
        let query = 'SELECT * FROM tasks WHERE userId = ?';
        const params = [userId];

        if (options.status) {
            query += ' AND status = ?';
            params.push(options.status);
        }

        if (options.priority) {
            query += ' AND priority = ?';
            params.push(options.priority);
        }

        if (options.category) {
            query += ' AND category = ?';
            params.push(options.category);
        }

        query += ' ORDER BY dueDate ASC, time ASC, "order" ASC';

        if (options.limit) {
            query += ' LIMIT ?';
            params.push(options.limit);
        }

        const stmt = db.prepare(query);
        const tasks = stmt.all(...params);
        return tasks.map(t => this._parseTask(t));
    }

    /**
     * Find tasks by user ID
     * @param {number} userId - User ID
     * @returns {Array} Tasks array
     */
    static findByUserId(userId) {
        return this.findAll(userId);
    }

    /**
     * Get today's tasks for a user
     * @param {number} userId - User ID
     * @returns {Array} Tasks array
     */
    static getTodayTasks(userId) {
        const today = new Date().toISOString().split('T')[0];
        
        const stmt = db.prepare(`
            SELECT * FROM tasks 
            WHERE userId = ? AND date(dueDate) = date(?)
            ORDER BY time ASC, "order" ASC
        `);
        
        const tasks = stmt.all(userId, today);
        return tasks.map(t => this._parseTask(t));
    }

    /**
     * Get upcoming tasks (after today) for a user
     * @param {number} userId - User ID
     * @returns {Array} Tasks array
     */
    static getUpcomingTasks(userId) {
        const today = new Date().toISOString().split('T')[0];
        
        const stmt = db.prepare(`
            SELECT * FROM tasks 
            WHERE userId = ? AND date(dueDate) > date(?) AND status = 'pending'
            ORDER BY dueDate ASC, time ASC
        `);
        
        const tasks = stmt.all(userId, today);
        return tasks.map(t => this._parseTask(t));
    }

    /**
     * Get completed tasks for a user
     * @param {number} userId - User ID
     * @param {number} limit - Limit results
     * @returns {Array} Tasks array
     */
    static getCompletedTasks(userId, limit = 50) {
        const stmt = db.prepare(`
            SELECT * FROM tasks 
            WHERE userId = ? AND status = 'completed'
            ORDER BY completedAt DESC
            LIMIT ?
        `);
        
        const tasks = stmt.all(userId, limit);
        return tasks.map(t => this._parseTask(t));
    }

    /**
     * Get tasks for calendar view
     * @param {number} userId - User ID
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Array} Tasks array
     */
    static getCalendarTasks(userId, startDate, endDate) {
        const stmt = db.prepare(`
            SELECT * FROM tasks 
            WHERE userId = ? AND date(dueDate) BETWEEN date(?) AND date(?)
            ORDER BY dueDate ASC, time ASC
        `);
        
        const tasks = stmt.all(userId, startDate, endDate);
        return tasks.map(t => this._parseTask(t));
    }

    /**
     * Get task statistics for a user
     * @param {number} userId - User ID
     * @returns {Object} Statistics object
     */
    static getStats(userId) {
        const today = new Date().toISOString().split('T')[0];
        
        // Get start and end of current week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

        // Total tasks
        const totalStmt = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE userId = ?');
        const totalTasks = totalStmt.get(userId).count;

        // Completed tasks
        const completedStmt = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND status = 'completed'");
        const completedTasks = completedStmt.get(userId).count;

        // Pending tasks
        const pendingStmt = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND status = 'pending'");
        const pendingTasks = pendingStmt.get(userId).count;

        // Today's tasks
        const todayStmt = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND date(dueDate) = date(?)');
        const todayTasks = todayStmt.get(userId, today).count;

        // Today's completed
        const todayCompletedStmt = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND date(dueDate) = date(?) AND status = 'completed'");
        const todayCompleted = todayCompletedStmt.get(userId, today).count;

        // Week completed
        const weekCompletedStmt = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND status = 'completed' AND date(completedAt) BETWEEN date(?) AND date(?)");
        const weekCompleted = weekCompletedStmt.get(userId, startOfWeekStr, endOfWeekStr).count;

        // Priority tasks
        const highStmt = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND priority = 'high' AND status = 'pending'");
        const highPriority = highStmt.get(userId).count;

        const mediumStmt = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND priority = 'medium' AND status = 'pending'");
        const mediumPriority = mediumStmt.get(userId).count;

        const lowStmt = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND priority = 'low' AND status = 'pending'");
        const lowPriority = lowStmt.get(userId).count;

        return {
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            today: {
                total: todayTasks,
                completed: todayCompleted,
                pending: todayTasks - todayCompleted
            },
            week: {
                completed: weekCompleted
            },
            priority: {
                high: highPriority,
                medium: mediumPriority,
                low: lowPriority
            },
            completionRate: totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0
        };
    }

    /**
     * Update task
     * @param {number} id - Task ID
     * @param {Object} updateData - Data to update
     * @returns {Object|null} Updated task
     */
    static update(id, updateData) {
        const allowedFields = ['title', 'description', 'dueDate', 'time', 'priority', 'status', 'category', 'reminderEnabled', 'reminderSent', 'order', 'completedAt'];
        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                if (field === 'reminderEnabled' || field === 'reminderSent') {
                    values.push(updateData[field] ? 1 : 0);
                } else {
                    values.push(updateData[field]);
                }
            }
        }

        if (updates.length === 0) return this.findById(id);

        updates.push(`updatedAt = datetime('now')`);
        values.push(id);

        const stmt = db.prepare(`
            UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
        `);
        
        stmt.run(...values);
        return this.findById(id);
    }

    /**
     * Mark task as completed
     * @param {number} id - Task ID
     * @returns {Object|null} Updated task
     */
    static markCompleted(id) {
        return this.update(id, {
            status: 'completed',
            completedAt: new Date().toISOString()
        });
    }

    /**
     * Mark task as pending
     * @param {number} id - Task ID
     * @returns {Object|null} Updated task
     */
    static markPending(id) {
        return this.update(id, {
            status: 'pending',
            completedAt: null
        });
    }

    /**
     * Toggle task completion
     * @param {number} id - Task ID
     * @returns {Object|null} Updated task
     */
    static toggleComplete(id) {
        const task = this.findById(id);
        if (!task) return null;
        
        if (task.status === 'completed') {
            return this.markPending(id);
        } else {
            return this.markCompleted(id);
        }
    }

    /**
     * Delete task
     * @param {number} id - Task ID
     * @returns {boolean} Success
     */
    static delete(id) {
        const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
     * Get tasks needing reminders
     * @returns {Array} Tasks array
     */
    static getTasksNeedingReminders() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        const stmt = db.prepare(`
            SELECT t.*, u.email as userEmail, u.name as userName
            FROM tasks t
            JOIN users u ON t.userId = u.id
            WHERE t.reminderEnabled = 1 
            AND t.reminderSent = 0 
            AND t.status = 'pending'
            AND date(t.dueDate) = date(?)
        `);
        
        const tasks = stmt.all(today);
        return tasks.map(t => this._parseTask(t));
    }

    /**
     * Mark reminder sent
     * @param {number} id - Task ID
     * @returns {Object|null} Updated task
     */
    static markReminderSent(id) {
        return this.update(id, { reminderSent: 1 });
    }

    /**
     * Parse task object and convert types
     * @private
     */
    static _parseTask(task) {
        const parsed = { ...task };
        
        // Convert integers to booleans
        parsed.reminderEnabled = !!parsed.reminderEnabled;
        parsed.reminderSent = !!parsed.reminderSent;
        
        // Ensure order is a number
        parsed.order = parseInt(parsed.order) || 0;
        
        return parsed;
    }
}

module.exports = Task;
