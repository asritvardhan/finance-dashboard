const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const { HTTP_STATUS } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(HTTP_STATUS.CONFLICT).json({
            success: false,
            message: 'User already exists with this email'
        });
    }
    
    // Create user (only admin can assign roles, default is viewer)
    const userData = {
        name,
        email,
        password,
        role: role || 'viewer'
    };
    
    // Only allow role assignment if requester is admin (handled in route)
    if (req.user && req.user.role === 'admin' && role) {
        userData.role = role;
    }
    
    const user = await User.create(userData);
    
    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            },
            token,
            refreshToken
        }
    });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Validate email and password
    if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Please provide email and password'
        });
    }
    
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
    
    // Check if user is active
    if (!user.isActive()) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Your account is inactive. Please contact administrator.'
        });
    }
    
    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            },
            token,
            refreshToken
        }
    });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken;
    
    if (refreshToken) {
        // Revoke the refresh token
        await RefreshToken.findOneAndUpdate(
            { token: refreshToken },
            { isRevoked: true }
        );
    }
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user
    });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Refresh token required'
        });
    }
    
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken, isRevoked: false });
    
    if (!tokenDoc || tokenDoc.expiresAt < Date.now()) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
    
    // Generate new tokens
    const newToken = generateToken(tokenDoc.user);
    const newRefreshToken = await generateRefreshToken(tokenDoc.user);
    
    // Revoke old refresh token
    tokenDoc.isRevoked = true;
    await tokenDoc.save();
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
            token: newToken,
            refreshToken: newRefreshToken
        }
    });
});

module.exports = {
    register,
    login,
    logout,
    getMe,
    refreshToken
};