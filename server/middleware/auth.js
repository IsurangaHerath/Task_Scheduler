const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * 
 * Provides JWT-based authentication and authorization for protected routes.
 * Includes token verification, user validation, and role-based access control.
 */

// Default JWT expiration time
const DEFAULT_TOKEN_EXPIRY = '7d';

/**
 * Protect Routes Middleware
 * 
 * Verifies JWT token from Authorization header and attaches user to request.
 * Returns 401 if no token provided or token is invalid.
 * Returns 403 if user account is disabled.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.protect = async (req, res, next) => {
    let token;

    // Check for Bearer token in Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extract token from "Bearer <token>" format
            token = req.headers.authorization.split(' ')[1];

            // Verify token signature and expiration
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Retrieve user from database using token payload
            const user = await User.findById(decoded.id);

            // Verify user still exists
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found - Token invalid'
                });
            }

            // Check if user account is active
            if (user.status === 'disabled') {
                return res.status(403).json({
                    success: false,
                    message: 'Account is disabled. Contact administrator.'
                });
            }

            // Attach user to request object for downstream use
            req.user = user;
            next();
        } catch (error) {
            console.error('Auth middleware error:', error.message);

            // Handle specific JWT errors
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            }

            // Generic unauthorized response
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
    }

    // No token provided
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - No token provided'
        });
    }
};

/**
 * Optional Authentication Middleware
 * 
 * Similar to protect, but doesn't require authentication.
 * Attaches user to request if valid token is provided,
 * but continues without user if no token or invalid token.
 * Useful for routes that behave differently based on auth status.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.optionalAuth = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            // Attach user only if found
            if (user) {
                req.user = user;
            }
        } catch (error) {
            // Silently continue without user - token is optional
        }
    }

    next();
};

/**
 * Generate JWT Token
 * 
 * Creates a signed JWT token containing user ID.
 * Token expires based on JWT_EXPIRE env var or defaults to 7 days.
 * 
 * @param {string} userId - User ID to encode in token payload
 * @returns {string} Signed JWT token
 */
exports.generateToken = (userId) => {
    return jwt.sign(
        { id: userId }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: process.env.JWT_EXPIRE || DEFAULT_TOKEN_EXPIRY
        }
    );
};

/**
 * Role-Based Authorization Middleware
 * 
 * Factory function that returns middleware to check user roles.
 * Must be used after protect middleware since it relies on req.user.
 * 
 * @param {...string} allowedRoles - List of roles permitted to access the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Require admin role
 * router.get('/admin', protect, authorize('admin'), adminController.getAll);
 * 
 * // Require admin or moderator
 * router.get('/users', protect, authorize('admin', 'moderator'), userController.getAll);
 */
exports.authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Ensure protect middleware ran first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized - No token provided'
            });
        }
        
        // Check if user's role is in allowed list
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized - Insufficient permissions'
            });
        }
        
        next();
    };
};
