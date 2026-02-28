const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
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
    const user = await User.create({
        name,
        email,
        password
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: user,
            token
        }
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Compare password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
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
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
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
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;

    // Check if email is being changed and if it's already taken
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

    // Update user
    const user = await User.update(req.user.id, updateData);

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: user
        }
    });
});

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByIdWithPassword(req.user.id);

    // Verify current password
    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Update password
    await User.updatePassword(req.user.id, newPassword);

    // Generate new token
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
 * @desc    Update user settings
 * @route   PUT /api/auth/settings
 * @access  Private
 */
const updateSettings = asyncHandler(async (req, res) => {
    const { notifications, theme, reminderTime } = req.body;

    const user = await User.findById(req.user.id);

    // Update settings
    if (notifications) {
        user.settings.notifications = {
            ...user.settings.notifications,
            ...notifications
        };
    }

    if (theme) {
        user.settings.theme = theme;
    }

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
 * @desc    Get user settings
 * @route   GET /api/auth/settings
 * @access  Private
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
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    // JWT is stateless, so logout is handled client-side
    // This endpoint exists for consistency and future token blacklisting
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/auth/account
 * @access  Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    // Get user with password
    const user = await User.findByIdWithPassword(req.user.id);

    // Verify password before deletion
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Password is incorrect'
        });
    }

    // Delete user's tasks first
    const Task = require('../models/Task');
    const tasks = Task.findAll(req.user.id);
    tasks.forEach(task => Task.delete(task.id));

    // Delete user
    await User.delete(req.user.id);

    res.json({
        success: true,
        message: 'Account deleted successfully'
    });
});

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    updateSettings,
    getSettings,
    logout,
    deleteAccount
};
