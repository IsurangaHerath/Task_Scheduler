const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar TEXT,
          role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
          settings JSONB DEFAULT '{"notifications":{"email":true,"browser":true},"theme":"light","reminderTime":15}',
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          "dueDate" TEXT NOT NULL,
          time TEXT DEFAULT '09:00',
          priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
          category TEXT DEFAULT 'general',
          reminderEnabled INTEGER DEFAULT 1,
          reminderSent INTEGER DEFAULT 0,
          "order" INTEGER DEFAULT 0,
          "completedAt" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks("userId", "dueDate");
        CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks("userId", status);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks("userId", priority);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL,
          "expires_at" TIMESTAMP NOT NULL,
          used INTEGER DEFAULT 0,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens("user_id");
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS weekly_tasks (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS weekly_task_completions (
          id SERIAL PRIMARY KEY,
          "weeklyTaskId" INTEGER NOT NULL REFERENCES weekly_tasks(id) ON DELETE CASCADE,
          "dayOfWeek" INTEGER NOT NULL CHECK("dayOfWeek" >= 0 AND "dayOfWeek" <= 6),
          "weekStartDate" TEXT NOT NULL,
          completed INTEGER DEFAULT 0,
          "completedAt" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("weeklyTaskId", "dayOfWeek", "weekStartDate")
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_weekly_tasks_user ON weekly_tasks("userId");
        CREATE INDEX IF NOT EXISTS idx_weekly_completions_task ON weekly_task_completions("weeklyTaskId");
        CREATE INDEX IF NOT EXISTS idx_weekly_completions_week ON weekly_task_completions("weekStartDate");
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      `);

      await client.query('COMMIT');
      console.log('✅ PostgreSQL Database initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  } finally {
  }
};

module.exports = { pool, initializeDatabase };