/**
 * Error Handling Middleware
 * 
 * Provides centralized error handling for the Express application.
 * Includes custom error class, async handler wrapper, and error responses.
 */

/**
 * Custom API Error Class
 * 
 * Extends the built-in Error class to include HTTP status code
 * and error type classification.
 * 
 * @extends Error
 * @property {number} statusCode - HTTP status code
 * @property {string} status - Error status type ('fail' or 'error')
 * @property {boolean} isOperational - Whether this is an operational error
 */
class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        // 'fail' for 4xx errors, 'error' for 5xx errors
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // Operational errors are expected errors we can handle gracefully
        this.isOperational = true;

        // Capture stack trace for debugging
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not Found Handler
 * 
 * Middleware to handle requests for undefined routes.
 * Creates an ApiError with 404 status and passes to error handler.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFound = (req, res, next) => {
    const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

/**
 * Global Error Handler
 * 
 * Centralized error handling middleware that catches all errors,
 * logs them appropriately, and sends standardized error responses.
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
    // Log error details for debugging
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Handle invalid ObjectId (CastError) - typically from malformed IDs
    if (err.name === 'CastError') {
        const message = 'Invalid resource ID';
        err = new ApiError(message, 400);
    }

    // Handle duplicate key errors - typically from unique constraints
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        err = new ApiError(message, 400);
    }

    // Handle validation errors - typically from Mongoose validation
    if (err.name === 'ValidationError') {
        const validationMessages = Object.values(err.errors).map(val => val.message);
        const message = validationMessages.join(', ');
        err = new ApiError(message, 400);
    }

    // Handle JWT authentication errors
    if (err.name === 'JsonWebTokenError') {
        err = new ApiError('Invalid token', 401);
    }

    // Handle expired JWT tokens
    if (err.name === 'TokenExpiredError') {
        err = new ApiError('Token expired', 401);
    }

    // Send standardized error response
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        // Include stack trace only in development mode
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Async Handler Wrapper
 * 
 * Utility function to wrap async route handlers.
 * Automatically catches any errors and passes them to Express error handling.
 * This eliminates the need for try-catch blocks in async controllers.
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Instead of:
 * router.get('/users', async (req, res) => {
 *     try {
 *         const users = await User.find();
 *         res.json(users);
 *     } catch (err) {
 *         next(err);
 *     }
 * });
 * 
 * // Use:
 * router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await User.find();
 *     res.json(users);
 * }));
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Export all error handling utilities
module.exports = {
    ApiError,
    notFound,
    errorHandler,
    asyncHandler
};
