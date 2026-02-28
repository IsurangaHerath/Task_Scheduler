require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { verifyEmailConfig } = require('./services/emailService');
const { initReminderService, stopAllReminders } = require('./services/reminderService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Initialize Express app
const app = express();

// Initialize database
initializeDatabase();

// Verify email configuration
verifyEmailConfig();

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API info endpoint
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

// Handle 404 - Route not found
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Set port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
    console.log(`
  🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
  📦 Port: ${PORT}
  🌐 API: http://localhost:${PORT}/api
  📊 Health: http://localhost:${PORT}/api/health
  `);

    // Initialize reminder service
    initReminderService();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`❌ Uncaught Exception: ${err.message}`);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    stopAllReminders();
    server.close(() => {
        console.log('💤 Process terminated');
        process.exit(0);
    });
});

module.exports = app;
