const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HTTP_STATUS } = require('../config/constants');

const protect = async (req, res, next) => {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Not authorized to access this route. Please login.'
        });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not found. Invalid token.'
            });
        }
        
        // Check if user is active
        if (!user.isActive()) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Your account is inactive. Please contact admin.'
            });
        }
        
        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Not authorized to access this route.'
        });
    }
};

module.exports = { protect };