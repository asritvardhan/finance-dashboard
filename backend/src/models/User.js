const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, USER_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.VIEWER
    },
    status: {
        type: String,
        enum: Object.values(USER_STATUS),
        default: USER_STATUS.ACTIVE
    },
    lastLogin: {
        type: Date,
        default: null
    },
    profilePicture: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving (Mongoose 8+: async hook — do not use next())
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user is active
userSchema.methods.isActive = function() {
    return this.status === USER_STATUS.ACTIVE;
};

// Check if user has specific role
userSchema.methods.hasRole = function(role) {
    return this.role === role;
};

module.exports = mongoose.model('User', userSchema);