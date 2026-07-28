const { pool } = require('../config/db');

class WeeklyTask {
  static getWeekStartDate(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  static clientDayToDbDay(clientDayIndex) {
    return (clientDayIndex + 1) % 7;
  }

  static dbDayToClientDay(dbDayIndex) {
    return dbDayIndex === 0 ? 6 : dbDayIndex - 1;
  }

  static async create(taskData) {
    const { userId, name } = taskData;
    
    const result = await pool.query(
      'INSERT INTO weekly_tasks ("userId", name) VALUES ($1, $2) RETURNING *',
      [userId, name]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM weekly_tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(userId) {
    const result = await pool.query('SELECT * FROM weekly_tasks WHERE "userId" = $1 ORDER BY "createdAt" ASC', [userId]);
    return result.rows;
  }

  static async update(id, updateData) {
    const { name } = updateData;
    
    if (!name) return this.findById(id);
    
    const result = await pool.query(
      'UPDATE weekly_tasks SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM weekly_tasks WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async getCompletionsForWeek(userId, weekStartDate = null) {
    const startDate = weekStartDate || this.getWeekStartDate();
    
    const tasks = await this.findAll(userId);
    
    const result = await pool.query(
      `SELECT * FROM weekly_task_completions 
       WHERE "weeklyTaskId" IN (SELECT id FROM weekly_tasks WHERE "userId" = $1)
       AND "weekStartDate" = $2`,
      [userId, startDate]
    );
    
    const completions = result.rows;
    
    const completionMap = {};
    for (const c of completions) {
      if (!completionMap[c.weeklyTaskId]) {
        completionMap[c.weeklyTaskId] = {};
      }
      const clientDayIndex = this.dbDayToClientDay(c.dayOfWeek);
      completionMap[c.weeklyTaskId][clientDayIndex] = {
        completed: !!c.completed,
        completedAt: c.completedAt
      };
    }
    
    return tasks.map(task => ({
      ...task,
      completions: completionMap[task.id] || {}
    }));
  }

  static async toggleCompletion(weeklyTaskId, dayOfWeek, weekStartDate = null) {
    const startDate = weekStartDate || this.getWeekStartDate();
    const dbDayIndex = this.clientDayToDbDay(dayOfWeek);
    
    const result = await pool.query(
      `SELECT * FROM weekly_task_completions 
       WHERE "weeklyTaskId" = $1 AND "dayOfWeek" = $2 AND "weekStartDate" = $3`,
      [weeklyTaskId, dbDayIndex, startDate]
    );
    
    const existing = result.rows[0];
    
    if (existing) {
      const newCompleted = existing.completed ? 0 : 1;
      const completedAt = newCompleted ? new Date().toISOString() : null;
      
      await pool.query(
        `UPDATE weekly_task_completions 
         SET completed = $1, "completedAt" = $2 
         WHERE "weeklyTaskId" = $3 AND "dayOfWeek" = $4 AND "weekStartDate" = $5`,
        [newCompleted, completedAt, weeklyTaskId, dbDayIndex, startDate]
      );
      
      return {
        completed: !!newCompleted,
        completedAt
      };
    } else {
      await pool.query(
        `INSERT INTO weekly_task_completions ("weeklyTaskId", "dayOfWeek", "weekStartDate", completed, "completedAt")
         VALUES ($1, $2, $3, 1, $4)`,
        [weeklyTaskId, dbDayIndex, startDate, new Date().toISOString()]
      );
      
      return {
        completed: true,
        completedAt: new Date().toISOString()
      };
    }
  }

  static async getWeeklyProgress(userId, weekStartDate = null) {
    const startDate = weekStartDate || this.getWeekStartDate();
    
    const tasks = await this.findAll(userId);
    const totalTasks = tasks.length;
    const totalPossible = totalTasks * 7;
    
    if (totalTasks === 0) {
      return {
        completed: 0,
        missed: 0,
        total: 0,
        completionRate: 0
      };
    }
    
    const result = await pool.query(
      `SELECT 
         SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as missed
       FROM weekly_task_completions 
       WHERE "weeklyTaskId" IN (SELECT id FROM weekly_tasks WHERE "userId" = $1)
       AND "weekStartDate" = $2`,
      [userId, startDate]
    );
    
    const completed = parseInt(result.rows[0].completed) || 0;
    const missed = parseInt(result.rows[0].missed) || 0;
    const total = completed + missed;
    
    return {
      completed,
      missed,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }
}

module.exports = WeeklyTask;