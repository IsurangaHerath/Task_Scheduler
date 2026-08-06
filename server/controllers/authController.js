const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendPasswordResetEmail } = require('../services/emailService');
const sessionService = require('../services/sessionService');
const crypto = require('crypto');
const { pool } = require('../config/db');

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

// Function: register
// Triggered by: Registration form submission from Register.jsx (handleSubmit -> AuthContext.register)
// Endpoint: POST /api/auth/register
// Purpose: Create a new user account
// Input: name, email, password (JSON body)
// Database: SELECTs users table to check email uniqueness; INSERTs new user with bcrypt-hashed password
// Output: 201 with { success, message, data: { user, token } }; 400 if email already registered
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

// Function: login
// Triggered by: Login form submission from Login.jsx (handleSubmit -> AuthContext.login)
// Endpoint: POST /api/auth/login
// Purpose: Authenticate user credentials and generate access token
// Input: email, password (JSON body)
// Database: SELECTs user from users table (with password hash), compares password via bcrypt;
//           records session in in-memory sessionService map for admin session tracking
// Output: 200 with { success, message, data: { user (password removed), token } };
//           401 if email or password is invalid
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

// Function: forgotPassword
// Triggered by: ForgotPassword.jsx form submission (handleSubmit -> authService.forgotPassword)
// Endpoint: POST /api/auth/forgot-password
// Purpose: Generate a password reset token and email a reset link to the user
// Input: email (JSON body)
// Database: SELECTs user by email; DELETEs old tokens; INSERTs hashed token into password_reset_tokens
// Output: Always 200 with generic success message (prevents email enumeration);
//           sends reset email via sendPasswordResetEmail (emailService)
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
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    // Insert new reset token
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, hashedToken, expiresAt]
    );

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

// Function: resetPassword
// Triggered by: ResetPassword.jsx form submission (handleSubmit -> authService.resetPassword)
// Endpoint: POST /api/auth/reset-password
// Purpose: Validate the reset token and set a new password for the user
// Input: token, password, confirmPassword (JSON body)
// Database: SELECTs unexpired, unused token from password_reset_tokens; UPDATEs users password (hashed);
//           marks token used; DELETEs all other tokens for the user
// Output: 200 with success message; 400 for invalid/expired token, mismatched or weak password
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
    const { rows: tokenResults } = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND used = 0 AND expires_at > NOW()`,
      [hashedToken]
    );
    const resetTokenRecord = tokenResults[0];

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
    await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE id = $1', [resetTokenRecord.id]);

    // Invalidate all other reset tokens for this user (security)
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND id != $2', [user.id, resetTokenRecord.id]);

    res.json({
        success: true,
        message: 'Password has been reset successfully'
    });
});

// ==================== Protected Routes ====================

// Function: getMe
// Triggered by: App mount / AuthContext.initAuth on page reload (authService.getCurrentUser)
// Endpoint: GET /api/auth/me
// Purpose: Return the current authenticated user profile
// Input: Authorization Bearer token (user attached by protect middleware)
// Database: No direct query here (user loaded by protect middleware via User.findById)
// Output: 200 with { success, data: { user } }
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

// Function: updateProfile
// Triggered by: Settings.jsx Profile tab "Save Changes" (handleProfileSubmit -> AuthContext.updateProfile)
// Endpoint: PUT /api/auth/profile
// Purpose: Update the current user's name and/or email
// Input: name, email (both optional, JSON body)
// Database: SELECTs users to verify new email uniqueness; UPDATEs users row
// Output: 200 with { success, message, data: { user } }; 400 if new email already in use
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

// Function: changePassword
// Triggered by: Settings.jsx Security tab "Update Password" (handlePasswordSubmit -> AuthContext.changePassword)
// Endpoint: PUT /api/auth/password
// Purpose: Verify the current password and set a new password
// Input: currentPassword, newPassword (JSON body)
// Database: SELECTs user with password hash; UPDATEs users password (bcrypt-hashed)
// Output: 200 with { success, message, data: { token } }; 401 if current password is incorrect
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

// Function: updateSettings
// Triggered by: Settings.jsx Notifications tab "Save Preferences" (handleSettingsSubmit -> AuthContext.updateSettings)
// Endpoint: PUT /api/auth/settings
// Purpose: Update notification preferences, theme, and default reminder time
// Input: notifications, theme, reminderTime (JSON body)
// Database: SELECTs user; UPDATEs users settings column (stored as JSON)
// Output: 200 with { success, message, data: { settings } }
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

// Function: getSettings
// Triggered by: No current frontend caller (authService.getSettings is defined but never invoked by any component)
// Endpoint: GET /api/auth/settings
// Purpose: Fetch the current user's saved settings
// Input: Authorization Bearer token
// Database: SELECTs user and returns settings column
// Output: 200 with { success, data: { settings } }
// NOTE: Unused backend function - no frontend flow triggers this endpoint
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

// Function: logout
// Triggered by: Logout button in Header.jsx / Sidebar.jsx (AuthContext.logout)
// Endpoint: POST /api/auth/logout
// Purpose: Remove the user's active session from the session tracker
// Input: Authorization Bearer token
// Database: No DB query; removes session from in-memory sessionService map
// Output: 200 with { success, message }; client also clears token from localStorage
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

// Function: deleteAccount
// Triggered by: Settings.jsx Security tab "Confirm Delete" (handleDeleteAccount -> AuthContext.deleteAccount)
// Endpoint: DELETE /api/auth/account
// Purpose: Permanently delete the user account and all of their tasks
// Input: password (JSON body, used for verification)
// Database: SELECTs user with password hash; SELECTs and DELETEs all user tasks; DELETEs user row
// Output: 200 with { success, message }; 401 if password is incorrect
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
    const userTasks = await Task.findAll(req.user.id);
    for (const task of userTasks) {
      await Task.delete(task.id);
    }

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
