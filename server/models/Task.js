const { pool } = require('../config/db');

class Task {
  static async create(taskData) {
    const { userId, title, description, dueDate, time, priority, status, category, reminderEnabled, order } = taskData;
    
    const result = await pool.query(
      `INSERT INTO tasks ("userId", title, description, "dueDate", time, priority, status, category, reminderEnabled, "order")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
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
      ]
    );
    
    return this._parseTask(result.rows[0]);
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length) {
      return this._parseTask(result.rows[0]);
    }
    return null;
  }

  static async findAll(userId, options = {}) {
    let query = 'SELECT * FROM tasks WHERE "userId" = $1';
    const params = [userId];
    let paramIndex = 2;

    if (options.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }

    if (options.priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(options.priority);
      paramIndex++;
    }

    if (options.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(options.category);
      paramIndex++;
    }

    query += ' ORDER BY "dueDate" ASC, time ASC, "order" ASC';

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
    }

    const result = await pool.query(query, params);
    return result.rows.map(t => this._parseTask(t));
  }

  static findByUserId(userId) {
    return this.findAll(userId);
  }

  static async getTodayTasks(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE "userId" = $1 AND DATE("dueDate") = DATE($2)
       ORDER BY time ASC, "order" ASC`,
      [userId, today]
    );
    
    return result.rows.map(t => this._parseTask(t));
  }

  static async getUpcomingTasks(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE "userId" = $1 AND DATE("dueDate") > DATE($2) AND status = 'pending'
       ORDER BY "dueDate" ASC, time ASC`,
      [userId, today]
    );
    
    return result.rows.map(t => this._parseTask(t));
  }

  static async getCompletedTasks(userId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE "userId" = $1 AND status = 'completed'
       ORDER BY "completedAt" DESC
       LIMIT $2`,
      [userId, limit]
    );
    
    return result.rows.map(t => this._parseTask(t));
  }

  static async getCalendarTasks(userId, startDate, endDate) {
    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE "userId" = $1 AND DATE("dueDate") BETWEEN DATE($2) AND DATE($3)
       ORDER BY "dueDate" ASC, time ASC`,
      [userId, startDate, endDate]
    );
    
    return result.rows.map(t => this._parseTask(t));
  }

  static async getStats(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    const results = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM tasks WHERE "userId" = $1', [userId]),
      pool.query("SELECT COUNT(*) as count FROM tasks WHERE \"userId\" = $1 AND status = 'completed'", [userId]),
      pool.query("SELECT COUNT(*) as count FROM tasks WHERE \"userId\" = $1 AND status = 'pending'", [userId]),
      pool.query('SELECT COUNT(*) as count FROM tasks WHERE "userId" = $1 AND DATE("dueDate") = DATE($2)', [userId, today]),
      pool.query("SELECT COUNT(*) as count FROM tasks WHERE \"userId\" = $1 AND DATE(\"dueDate\") = DATE($2) AND status = 'completed'", [userId, today]),
      pool.query("SELECT COUNT(*) as count FROM tasks WHERE \"userId\" = $1 AND status = 'completed' AND DATE(\"completedAt\") BETWEEN DATE($2) AND DATE($3)", [userId, startOfWeekStr, endOfWeekStr]),
      pool.query("SELECT COUNT(*) as count FROM tasks WHERE \"userId\" = $1 AND priority = 'high' AND status = 'pending'", [userId]),
      pool.query("SELECT COUNT(*) as count FROM tasks WHERE \"userId\" = $1 AND priority = 'medium' AND status = 'pending'", [userId]),
      pool.query("SELECT COUNT(*) as count FROM tasks WHERE \"userId\" = $1 AND priority = 'low' AND status = 'pending'", [userId])
    ]);

    const totalTasks = parseInt(results[0].rows[0].count);
    const completedTasks = parseInt(results[1].rows[0].count);
    const pendingTasks = parseInt(results[2].rows[0].count);
    const todayTasks = parseInt(results[3].rows[0].count);
    const todayCompleted = parseInt(results[4].rows[0].count);
    const weekCompleted = parseInt(results[5].rows[0].count);
    const highPriority = parseInt(results[6].rows[0].count);
    const mediumPriority = parseInt(results[7].rows[0].count);
    const lowPriority = parseInt(results[8].rows[0].count);

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

  static async update(id, updateData) {
    const allowedFields = ['title', 'description', 'dueDate', 'time', 'priority', 'status', 'category', 'reminderEnabled', 'reminderSent', 'order', 'completedAt'];
    const updates = [];
    const values = [];
    let valueIndex = 1;

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`"${field}" = $${valueIndex}`);
        if (field === 'reminderEnabled' || field === 'reminderSent') {
          values.push(updateData[field] ? 1 : 0);
        } else {
          values.push(updateData[field]);
        }
        valueIndex++;
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
      values
    );
    
    return this._parseTask(result.rows[0]);
  }

  static async toggleComplete(id) {
    const task = await this.findById(id);
    if (!task) return null;
    
    if (task.status === 'completed') {
      return this.update(id, {
        status: 'pending',
        completedAt: null
      });
    } else {
      return this.update(id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    }
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async getTasksNeedingReminders() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT t.*, u.email as "userEmail", u.name as "userName"
       FROM tasks t
       JOIN users u ON t."userId" = u.id
       WHERE t.reminderEnabled = 1 
       AND t.reminderSent = 0 
       AND t.status = 'pending'
       AND DATE(t."dueDate") = DATE($1)`,
      [today]
    );
    
    return result.rows.map(t => this._parseTask(t));
  }

  static _parseTask(task) {
    const parsed = { ...task };
    parsed._id = parsed.id;
    parsed.reminderEnabled = !!parsed.reminderEnabled;
    parsed.reminderSent = !!parsed.reminderSent;
    parsed.order = parseInt(parsed.order) || 0;
    return parsed;
  }
}

module.exports = Task;