const Joi = require('joi');

// User validation schemas
const userSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('viewer', 'analyst', 'admin'),
    status: Joi.string().valid('active', 'inactive')
});

const userUpdateSchema = Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string().valid('viewer', 'analyst', 'admin'),
    status: Joi.string().valid('active', 'inactive')
});

// Transaction validation schemas
const transactionSchema = Joi.object({
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('income', 'expense').required(),
    category: Joi.string().required(),
    date: Joi.date().iso(),
    notes: Joi.string().max(500),
    tags: Joi.array().items(Joi.string())
});

const transactionUpdateSchema = Joi.object({
    amount: Joi.number().positive(),
    type: Joi.string().valid('income', 'expense'),
    category: Joi.string(),
    date: Joi.date().iso(),
    notes: Joi.string().max(500),
    tags: Joi.array().items(Joi.string())
});

// Auth validation schemas
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});

// Dashboard query validation
const dashboardQuerySchema = Joi.object({
    period: Joi.string().valid('week', 'month', 'year'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    limit: Joi.number().integer().min(1).max(100)
});

module.exports = {
    userSchema,
    userUpdateSchema,
    transactionSchema,
    transactionUpdateSchema,
    loginSchema,
    registerSchema,
    dashboardQuerySchema
};