const { body } = require('express-validator');
const { ROLES } = require('../config/roles');

const validateUserCreation = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .trim(),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
];

const validateUserUpdate = [
    body('name')
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .trim(),
    body('email')
        .optional()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
];

const validateRoleUpdate = [
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`)
];

const validateStatusUpdate = [
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
];

module.exports = {
    validateUserCreation,
    validateUserUpdate,
    validateRoleUpdate,
    validateStatusUpdate
};