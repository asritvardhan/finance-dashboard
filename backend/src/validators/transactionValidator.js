const { body, query } = require('express-validator');
const { TRANSACTION_TYPES, ALL_CATEGORIES } = require('../config/constants');

const validateTransactionCreation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
        .toFloat(),
    body('type')
        .notEmpty().withMessage('Transaction type is required')
        .isIn(Object.values(TRANSACTION_TYPES)).withMessage(`Type must be: ${Object.values(TRANSACTION_TYPES).join(', ')}`),
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(ALL_CATEGORIES).withMessage(`Category must be one of: ${ALL_CATEGORIES.join(', ')}`),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    body('notes')
        .optional()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
        .trim(),
    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array')
];

const validateTransactionUpdate = [
    body('amount')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
        .toFloat(),
    body('type')
        .optional()
        .isIn(Object.values(TRANSACTION_TYPES)).withMessage(`Type must be: ${Object.values(TRANSACTION_TYPES).join(', ')}`),
    body('category')
        .optional()
        .isIn(ALL_CATEGORIES).withMessage(`Category must be one of: ${ALL_CATEGORIES.join(', ')}`),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    body('notes')
        .optional()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
        .trim(),
    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array')
];

const validateTransactionFilters = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt(),
    query('type')
        .optional()
        .isIn(Object.values(TRANSACTION_TYPES)).withMessage(`Type must be: ${Object.values(TRANSACTION_TYPES).join(', ')}`),
    query('category')
        .optional()
        .isIn(ALL_CATEGORIES).withMessage(`Category must be one of: ${ALL_CATEGORIES.join(', ')}`),
    query('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    query('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format'),
    query('minAmount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number')
        .toFloat(),
    query('maxAmount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number')
        .toFloat(),
    query('search')
        .optional()
        .trim()
];

module.exports = {
    validateTransactionCreation,
    validateTransactionUpdate,
    validateTransactionFilters
};