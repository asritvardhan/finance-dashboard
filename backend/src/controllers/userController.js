const User = require('../models/User');
const { HTTP_STATUS } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');

// @desc    Get all users
// @route   GET /api/users
// @access  Admin only
const getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    
    const users = await User.find(filter)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort('-createdAt');
    
    const total = await User.countDocuments(filter);
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin only
const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user
    });
});

// @desc    Create user
// @route   POST /api/users
// @access  Admin only
const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, status } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(HTTP_STATUS.CONFLICT).json({
            success: false,
            message: 'User already exists with this email'
        });
    }
    
    const user = await User.create({
        name,
        email,
        password,
        role: role || 'viewer',
        status: status || 'active'
    });
    
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'User created successfully',
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        }
    });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin only
const updateUser = asyncHandler(async (req, res) => {
    const { name, email, role, status } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;
    
    await user.save();
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User updated successfully',
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        }
    });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin only
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
    
    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'You cannot delete your own account'
        });
    }
    
    await user.deleteOne();
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User deleted successfully'
    });
});

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Admin only
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const validRoles = Object.values(ROLES);
    
    if (!role || !validRoles.includes(role)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Invalid role. Valid roles: ${validRoles.join(', ')}`
        });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
    
    user.role = role;
    await user.save();
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User role updated successfully',
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

// @desc    Update user status
// @route   PATCH /api/users/:id/status
// @access  Admin only
const updateUserStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid status. Valid status: active, inactive'
        });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'User not found'
        });
    }
    
    user.status = status;
    await user.save();
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `User status updated to ${status}`,
        data: {
            id: user._id,
            name: user.name,
            status: user.status
        }
    });
});

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateUserRole,
    updateUserStatus
};