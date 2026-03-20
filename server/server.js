require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { verifyEmailConfig } = require('./services/emailService');
const { initReminderService, stopAllReminders } = require('./services/reminderService');
const { createDefaultAdmin } = require('./services/adminService');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const weeklyRoutes = require('./routes/weeklyRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express application
const app = express();

// ==================== Initialization ====================

// Initialize database and create tables
initializeDatabase();

// Create default admin account if not exists
createDefaultAdmin();

// Verify email service configuration
verifyEmailConfig();

// ==================== Middleware Configuration ====================

// Parse JSON bodies with 10MB limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration - allows cross-origin requests from the client
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==================== API Routes ====================

// Authentication routes (register, login, logout, password reset, etc.)
app.use('/api/auth', authRoutes);

// Task management routes (CRUD operations, stats, calendar, etc.)
app.use('/api/tasks', taskRoutes);

// Weekly task tracking routes
app.use('/api/weekly', weeklyRoutes);

// Admin routes (user management, sessions, etc.)
app.use('/api/admin', adminRoutes);

// ==================== Serve Static Files (Production) ====================
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

// ==================== Info Endpoints ====================

/**
 * Health check endpoint
 * Used to verify the server is running and responsive
 */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * API information endpoint
 * Provides metadata about available API endpoints
 */
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

// ==================== Error Handling ====================

// Handle 404 - Route not found
app.use(notFound);

// Global error handler middleware
app.use(errorHandler);

// ==================== Server Startup ====================

// Get port from environment or use default
const PORT = process.env.PORT || 5000;

// Start HTTP server
const server = app.listen(PORT, () => {
    console.log(`
  🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
  📦 Port: ${PORT}
  🌐 API: http://localhost:${PORT}/api
  📊 Health: http://localhost:${PORT}/api/health
    `);

    // Initialize background reminder service after server starts
    initReminderService();
});

// ==================== Process Event Handlers ====================

// Handle unhandled promise rejections
// This catches async errors that weren't caught by try-catch blocks
process.on('unhandledRejection', (err, promise) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    // Close server and exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
// This catches synchronous errors that crash the application
process.on('uncaughtException', (err) => {
    console.error(`❌ Uncaught Exception: ${err.message}`);
    process.exit(1);
});

// Graceful shutdown handler
// Handles SIGTERM signal (e.g., from container orchestration)
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    
    // Stop all scheduled reminders
    stopAllReminders();
    
    // Close server and exit
    server.close(() => {
        console.log('💤 Process terminated');
        process.exit(0);
    });
});

// Export app for testing purposes
module.exports = app;
