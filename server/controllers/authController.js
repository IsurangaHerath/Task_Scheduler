const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendPasswordResetEmail } = require('../services/emailService');
const sessionService = require('../services/sessionService');
const crypto = require('crypto');
const { db } = require('../config/db');

/**
 * Authentication Controller
 * 
 * Handles all authentication-related API endpoints including:
 * - User registration and login
 * - Profile management
 * - Password management (change, reset)
 * - User settings
 * - Account deletion
 */

// ==================== Public Routes ====================

/**
 * Register a new user account
 * 
 * @route POST /api/auth/register
 * @access Public
 * @body {string} name - User's display name
 * @body {string} email - User's email address (must be unique)
 * @body {string} password - User's password
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Email already registered'
        });
    }

    // Create new user
    const newUser = await User.create({
        name,
        email,
        password
    });

    // Generate authentication token
    const token = generateToken(newUser.id);

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: newUser,
            token
        }
    });
});

/**
 * Authenticate user and get token
 * 
 * @route POST /api/auth/login
 * @access Public
 * @body {string} email - User's email address
 * @body {string} password - User's password
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email (includes password for verification)
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Verify password
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Generate authentication token
    const token = generateToken(user.id);

    // Track session for admin panel functionality
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    sessionService.trackSession(
        user.id, 
        token, 
        new Date(decodedToken.exp * 1000).toISOString()
    );

    // Remove password from response for security
    delete user.password;

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: user,
            token
        }
    });
});

/**
 * Request password reset email
 * 
 * @route POST /api/auth/forgot-password
 * @access Public
 * @body {string} email - User's email address
 * 
 * Note: Always returns success to prevent email enumeration attacks
 */
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Generic response message for security
    const responseMessage = 'If an account with that email exists, we have sent password reset instructions.';

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    // Always return success to prevent email enumeration
    // This is a security best practice
    if (!user) {
        // Add small delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 100));
        return res.json({
            success: true,
            message: responseMessage
        });
    }

    // Generate secure random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before storing in database (security best practice)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiration time (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Delete any existing reset tokens for this user
    const deleteStmt = db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?');
    deleteStmt.run(user.id);

    // Insert new reset token
    const insertStmt = db.prepare(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
    `);
    insertStmt.run(user.id, hashedToken, expiresAt);

    // Get the frontend URL from environment or use default
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(user, resetUrl);

    if (!emailSent) {
        console.error('Failed to send password reset email');
    }

    res.json({
        success: true,
        message: responseMessage
    });
});

/**
 * Reset password using token
 * 
 * @route POST /api/auth/reset-password
 * @access Public
 * @body {string} token - Password reset token from email
 * @body {string} password - New password
 * @body {string} confirmPassword - Confirmation of new password
 */
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    // Validate required fields
    if (!token || !password || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Token, password, and confirm password are required'
        });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Passwords do not match'
        });
    }

    // Validate password strength requirements
    // Minimum 8 characters, at least one lowercase, one uppercase, and one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters with at least one uppercase letter and one number'
        });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid (unused and not expired) reset token
    const stmt = db.prepare(`
        SELECT * FROM password_reset_tokens 
        WHERE token = ? AND used = 0 AND expires_at > datetime('now')
    `);
    const resetTokenRecord = stmt.get(hashedToken);

    if (!resetTokenRecord) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }

    // Find the user associated with the token
    const user = await User.findById(resetTokenRecord.user_id);
    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'User not found'
        });
    }

    // Update the user's password (will be hashed in the model)
    await User.updatePassword(user.id, password);

    // Mark the reset token as used
    const updateStmt = db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?');
    updateStmt.run(resetTokenRecord.id);

    // Invalidate all other reset tokens for this user (security)
    const deleteStmt = db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ? AND id != ?');
    deleteStmt.run(user.id, resetTokenRecord.id);

    res.json({
        success: true,
        message: 'Password has been reset successfully'
    });
});

// ==================== Protected Routes ====================

/**
 * Get current authenticated user profile
 * 
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

/**
 * Update user profile (name and email)
 * 
 * @route PUT /api/auth/profile
 * @access Private
 * @body {string} name - New display name
 * @body {string} email - New email address
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    // Build update object with provided fields
    const updateData = {};
    if (name) updateData.name = name;

    // Check if email is being changed and verify it's not already taken
    if (email && email !== req.user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }
        updateData.email = email;
    }

    // Update user in database
    const updatedUser = await User.update(req.user.id, updateData);

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: updatedUser
        }
    });
});

/**
 * Change user password (requires current password)
 * 
 * @route PUT /api/auth/password
 * @access Private
 * @body {string} currentPassword - User's current password
 * @body {string} newPassword - New password to set
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password for verification
    const user = await User.findByIdWithPassword(req.user.id);

    // Verify current password
    const isPasswordValid = await User.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Update password
    await User.updatePassword(req.user.id, newPassword);

    // Generate new token after password change
    const token = generateToken(req.user.id);

    res.json({
        success: true,
        message: 'Password changed successfully',
        data: {
            token
        }
    });
});

/**
 * Update user settings
 * 
 * @route PUT /api/auth/settings
 * @access Private
 * @body {Object} notifications - Notification preferences
 * @body {string} theme - Theme preference ('light' or 'dark')
 * @body {number} reminderTime - Default reminder time in minutes
 */
const updateSettings = asyncHandler(async (req, res) => {
    const { notifications, theme, reminderTime } = req.body;

    const user = await User.findById(req.user.id);

    // Update notification settings
    if (notifications) {
        user.settings.notifications = {
            ...user.settings.notifications,
            ...notifications
        };
    }

    // Update theme preference
    if (theme) {
        user.settings.theme = theme;
    }

    // Update reminder time
    if (reminderTime !== undefined) {
        user.settings.reminderTime = reminderTime;
    }

    // Save updated settings
    await User.update(req.user.id, { settings: user.settings });

    const updatedUser = await User.findById(req.user.id);

    res.json({
        success: true,
        message: 'Settings updated successfully',
        data: {
            settings: updatedUser.settings
        }
    });
});

/**
 * Get user settings
 * 
 * @route GET /api/auth/settings
 * @access Private
 */
const getSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.json({
        success: true,
        data: {
            settings: user.settings
        }
    });
});

/**
 * Logout user (server-side session cleanup)
 * 
 * @route POST /api/auth/logout
 * @access Private
 * 
 * Note: Client should also remove the JWT token from storage
 */
const logout = asyncHandler(async (req, res) => {
    // Remove session from tracking
    sessionService.removeSession(req.user.id);
    
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * Delete user account
 * 
 * @route DELETE /api/auth/account
 * @access Private
 * @body {string} password - Current password for verification
 * 
 * Note: This will also delete all user's tasks
 */
const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    // Get user with password for verification
    const user = await User.findByIdWithPassword(req.user.id);

    // Verify password before deletion
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Password is incorrect'
        });
    }

    // Delete user's tasks first (maintain referential integrity)
    const Task = require('../models/Task');
    const userTasks = Task.findAll(req.user.id);
    userTasks.forEach(task => Task.delete(task.id));

    // Delete user account
    await User.delete(req.user.id);

    res.json({
        success: true,
        message: 'Account deleted successfully'
    });
});

// Export all controller functions
module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    updateSettings,
    getSettings,
    logout,
    deleteAccount,
    forgotPassword,
    resetPassword
};
