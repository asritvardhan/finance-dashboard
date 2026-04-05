const { HTTP_STATUS } = require('../config/constants');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    
    console.error('Error:', err);
    
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = { message, statusCode: HTTP_STATUS.NOT_FOUND };
    }
    
    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `${field} already exists`;
        error = { message, statusCode: HTTP_STATUS.CONFLICT };
    }
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: HTTP_STATUS.BAD_REQUEST };
    }
    
    // JWT error
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: HTTP_STATUS.UNAUTHORIZED };
    }
    
    // Token expired error
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: HTTP_STATUS.UNAUTHORIZED };
    }
    
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

// Async handler to avoid try-catch blocks
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    asyncHandler
};