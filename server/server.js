require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { verifyEmailConfig } = require('./services/emailService');
const { initReminderService, stopAllReminders } = require('./services/reminderService');
const { createDefaultAdmin } = require('./services/adminService');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const weeklyRoutes = require('./routes/weeklyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const startServer = async () => {
  try {
    await initializeDatabase();
    await createDefaultAdmin();
    verifyEmailConfig();
  } catch (error) {
    console.error('❌ Initialization error:', error);
    process.exit(1);
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const defaultOrigins = ['http://localhost:5173', 'https://task-scheduler-client.netlify.app'];
  const envOrigins = (process.env.CLIENT_URL || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowedOrigins = [...envOrigins, ...defaultOrigins].map(o => o.toLowerCase().replace(/\/+$/, ''));

  app.use(cors({
    origin: (origin, callback) => {
      const isDev = process.env.NODE_ENV !== 'production';
      const normalized = origin ? origin.toLowerCase().replace(/\/+$/, '') : origin;
      if (!origin || isDev || allowedOrigins.includes(normalized)) {
        callback(null, true);
      } else {
        console.error(`❌ CORS blocked origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/weekly', weeklyRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'Task Scheduler API',
      version: '1.0.0',
      endpoints: {
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          logout: 'POST /api/auth/logout',
          me: 'GET /api/auth/me',
          profile: 'PUT /api/auth/profile',
          password: 'PUT /api/auth/password',
          settings: 'GET/PUT /api/auth/settings'
        },
        tasks: {
          all: 'GET /api/tasks',
          today: 'GET /api/tasks/today',
          upcoming: 'GET /api/tasks/upcoming',
          completed: 'GET /api/tasks/completed',
          stats: 'GET /api/tasks/stats',
          calendar: 'GET /api/tasks/calendar',
          create: 'POST /api/tasks',
          update: 'PUT /api/tasks/:id',
          delete: 'DELETE /api/tasks/:id',
          toggleComplete: 'PATCH /api/tasks/:id/complete',
          reorder: 'PUT /api/tasks/reorder'
        }
      }
    });
  });

  if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../client/dist');
    if (fs.existsSync(clientDistPath)) {
      app.use(express.static(clientDistPath));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    } else {
      console.log('⚠️ Client dist not found at', clientDistPath, '- static serving disabled');
    }
  }

  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`
  🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
  📦 Port: ${PORT}
  🌐 API: http://localhost:${PORT}/api
  📊 Health: http://localhost:${PORT}/api/health
    `);

    initReminderService();
  });

  process.on('unhandledRejection', (err, promise) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    console.error(`❌ Uncaught Exception: ${err.message}`);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    stopAllReminders();
    server.close(() => {
      console.log('💤 Process terminated');
      process.exit(0);
    });
  });
};

startServer();

module.exports = app;