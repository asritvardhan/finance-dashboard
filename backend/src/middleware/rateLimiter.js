const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Limiter for transaction creation
const transactionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 transactions per hour
    message: {
        success: false,
        message: 'Transaction limit reached for this hour.'
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    transactionLimiter
};