const { db } = require('../config/db');

class WeeklyTask {
    static getWeekStartDate(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        // Monday as start of week: if Sunday (0), go back 6 days, otherwise go to Monday
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return d.toISOString().split('T')[0];
    }

    // Convert client day index (Mon=0, Sun=6) to DB day index (Sun=0, Sat=6)
    static clientDayToDbDay(clientDayIndex) {
        return (clientDayIndex + 1) % 7;
    }

    // Convert DB day index (Sun=0, Sat=6) to client day index (Mon=0, Sun=6)
    static dbDayToClientDay(dbDayIndex) {
        return dbDayIndex === 0 ? 6 : dbDayIndex - 1;
    }

    static create(taskData) {
        const { userId, name } = taskData;
        
        const stmt = db.prepare(`
            INSERT INTO weekly_tasks (userId, name)
            VALUES (?, ?)
        `);
        
        const result = stmt.run(userId, name);
        return this.findById(result.lastInsertRowid);
    }

    static findById(id) {
        const stmt = db.prepare('SELECT * FROM weekly_tasks WHERE id = ?');
        return stmt.get(id);
    }

    static findAll(userId) {
        const stmt = db.prepare('SELECT * FROM weekly_tasks WHERE userId = ? ORDER BY createdAt ASC');
        return stmt.all(userId);
    }

    static update(id, updateData) {
        const { name } = updateData;
        
        if (!name) return this.findById(id);
        
        const stmt = db.prepare('UPDATE weekly_tasks SET name = ? WHERE id = ?');
        stmt.run(name, id);
        return this.findById(id);
    }

    static delete(id) {
        const stmt = db.prepare('DELETE FROM weekly_tasks WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    static getCompletionsForWeek(userId, weekStartDate = null) {
        const startDate = weekStartDate || this.getWeekStartDate();
        
        const tasks = this.findAll(userId);
        
        const stmt = db.prepare(`
            SELECT * FROM weekly_task_completions 
            WHERE weeklyTaskId IN (SELECT id FROM weekly_tasks WHERE userId = ?)
            AND weekStartDate = ?
        `);
        
        const completions = stmt.all(userId, startDate);
        
        const completionMap = {};
        for (const c of completions) {
            if (!completionMap[c.weeklyTaskId]) {
                completionMap[c.weeklyTaskId] = {};
            }
            // Convert DB day index (Sun=0) to client day index (Mon=0)
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

    static toggleCompletion(weeklyTaskId, dayOfWeek, weekStartDate = null) {
        const startDate = weekStartDate || this.getWeekStartDate();
        // Convert client day index (Mon=0) to DB day index (Sun=0)
        const dbDayIndex = this.clientDayToDbDay(dayOfWeek);
        
        const existingStmt = db.prepare(`
            SELECT * FROM weekly_task_completions 
            WHERE weeklyTaskId = ? AND dayOfWeek = ? AND weekStartDate = ?
        `);
        
        const existing = existingStmt.get(weeklyTaskId, dbDayIndex, startDate);
        
        if (existing) {
            const newCompleted = existing.completed ? 0 : 1;
            const completedAt = newCompleted ? new Date().toISOString() : null;
            
            const updateStmt = db.prepare(`
                UPDATE weekly_task_completions 
                SET completed = ?, completedAt = ? 
                WHERE weeklyTaskId = ? AND dayOfWeek = ? AND weekStartDate = ?
            `);
            
            updateStmt.run(newCompleted, completedAt, weeklyTaskId, dbDayIndex, startDate);
            
            return {
                completed: !!newCompleted,
                completedAt
            };
        } else {
            const insertStmt = db.prepare(`
                INSERT INTO weekly_task_completions (weeklyTaskId, dayOfWeek, weekStartDate, completed, completedAt)
                VALUES (?, ?, ?, 1, datetime('now'))
            `);
            
            insertStmt.run(weeklyTaskId, dbDayIndex, startDate);
            
            return {
                completed: true,
                completedAt: new Date().toISOString()
            };
        }
    }

    static getWeeklyProgress(userId, weekStartDate = null) {
        const startDate = weekStartDate || this.getWeekStartDate();
        
        const tasks = this.findAll(userId);
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
        
        const stmt = db.prepare(`
            SELECT 
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as missed
            FROM weekly_task_completions 
            WHERE weeklyTaskId IN (SELECT id FROM weekly_tasks WHERE userId = ?)
            AND weekStartDate = ?
        `);
        
        const result = stmt.get(userId, startDate);
        
        const completed = result.completed || 0;
        const missed = result.missed || 0;
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
