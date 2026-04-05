const User = require('../models/User');

class UserService {
    async getAllUsers(filters = {}, pagination = {}) {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;
        
        const users = await User.find(filters)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort('-createdAt');
        
        const total = await User.countDocuments(filters);
        
        return {
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    async getUserById(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    
    async createUser(userData) {
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        
        const user = await User.create(userData);
        return user;
    }
    
    async updateUser(userId, updateData) {
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user;
    }
    
    async deleteUser(userId) {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
}

module.exports = new UserService();