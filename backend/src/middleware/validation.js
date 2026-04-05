const { validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../config/constants');

// Validation error handler middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
        }));
        
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
        });
    }
    
    next();
};

// Sanitize input
const sanitizeInput = (req, res, next) => {
    // Remove any potential malicious content
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim().replace(/[<>]/g, '');
            }
        });
    }
    next();
};

module.exports = {
    validateRequest,
    sanitizeInput
};