const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
    async register(userData) {
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        
        const user = await User.create(userData);
        return user;
    }
    
    async login(email, password) {
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            throw new Error('Invalid credentials');
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        
        if (!user.isActive()) {
            throw new Error('Account is inactive');
        }
        
        user.lastLogin = new Date();
        await user.save();
        
        return user;
    }
    
    generateToken(userId) {
        return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });
    }
    
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
}

module.exports = new AuthService();