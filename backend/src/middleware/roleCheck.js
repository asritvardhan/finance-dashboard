const { hasPermission } = require('../config/roles');
const { HTTP_STATUS } = require('../config/constants');

// Check if user has specific permission
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        if (hasPermission(req.user.role, permission)) {
            next();
        } else {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: `Access denied. You don't have permission to perform this action.`,
                requiredPermission: permission,
                userRole: req.user.role
            });
        }
    };
};

// Check if user has specific role
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        if (allowedRoles.includes(req.user.role)) {
            next();
        } else {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                userRole: req.user.role
            });
        }
    };
};

// Check if user owns the resource or is admin
const checkResourceOwnership = (Model, paramIdField = 'id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[paramIdField];
            const resource = await Model.findById(resourceId);
            
            if (!resource) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Resource not found'
                });
            }
            
            // Admin can access any resource
            if (req.user.role === 'admin') {
                req.resource = resource;
                return next();
            }
            
            // Check if user owns the resource
            if (resource.user && resource.user.toString() === req.user._id.toString()) {
                req.resource = resource;
                return next();
            }
            
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You do not have permission to access this resource'
            });
        } catch (error) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error checking resource ownership',
                error: error.message
            });
        }
    };
};

module.exports = {
    checkPermission,
    checkRole,
    checkResourceOwnership
};