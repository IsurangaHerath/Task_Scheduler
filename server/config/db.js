const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'task-scheduler.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database tables
 */
const initializeDatabase = () => {
    // Create users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT,
            settings TEXT DEFAULT '{"notifications":{"email":true,"browser":true},"theme":"light","reminderTime":15}',
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT DEFAULT (datetime('now'))
        )
    `);

    // Create tasks table
    db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            dueDate TEXT NOT NULL,
            time TEXT DEFAULT '09:00',
            priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
            category TEXT DEFAULT 'general',
            reminderEnabled INTEGER DEFAULT 1,
            reminderSent INTEGER DEFAULT 0,
            "order" INTEGER DEFAULT 0,
            completedAt TEXT,
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create indexes
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(userId, dueDate);
        CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(userId, status);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(userId, priority);
    `);

    console.log('✅ SQLite Database initialized');
};

module.exports = { db, initializeDatabase };
