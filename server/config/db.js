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
            role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
            settings TEXT DEFAULT '{"notifications":{"email":true,"browser":true},"theme":"light","reminderTime":15}',
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT DEFAULT (datetime('now'))
        )
    `);

    // Run migrations for existing databases
    runMigrations();

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

    // Create password reset tokens table
    db.exec(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create index for password reset tokens
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
    `);

    // Drop existing weekly tables if they exist (for clean reset)
    db.exec(`DROP TABLE IF EXISTS weekly_task_completions`);
    db.exec(`DROP TABLE IF EXISTS weekly_tasks`);

    // Create weekly_tasks table
    db.exec(`
        CREATE TABLE IF NOT EXISTS weekly_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            name TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create weekly_task_completions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS weekly_task_completions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            weeklyTaskId INTEGER NOT NULL,
            dayOfWeek INTEGER NOT NULL CHECK(dayOfWeek >= 0 AND dayOfWeek <= 6),
            weekStartDate TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            completedAt TEXT,
            createdAt TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (weeklyTaskId) REFERENCES weekly_tasks(id) ON DELETE CASCADE,
            UNIQUE(weeklyTaskId, dayOfWeek, weekStartDate)
        )
    `);

    // Create indexes for weekly tasks
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_weekly_tasks_user ON weekly_tasks(userId);
        CREATE INDEX IF NOT EXISTS idx_weekly_completions_task ON weekly_task_completions(weeklyTaskId);
        CREATE INDEX IF NOT EXISTS idx_weekly_completions_week ON weekly_task_completions(weekStartDate);
    `);

    console.log('✅ SQLite Database initialized');
};

/**
 * Run migrations for existing databases
 * Adds new columns to tables if they don't exist
 */
const runMigrations = () => {
    try {
        // Get current table structure
        const tableInfo = db.prepare("PRAGMA table_info(users)").all();
        const columns = tableInfo.map(col => col.name);
        
        // Add role column if it doesn't exist
        if (!columns.includes('role')) {
            db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'))");
            console.log('✅ Migration: Added role column to users table');
        }
        
        // Add status column if it doesn't exist
        if (!columns.includes('status')) {
            db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled'))");
            console.log('✅ Migration: Added status column to users table');
        }
        
        // Create indexes for admin queries
        db.exec("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
        db.exec("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)");
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
    }
};

module.exports = { db, initializeDatabase, runMigrations };
