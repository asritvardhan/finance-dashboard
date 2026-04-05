const express = require('express');
const { body, param, query } = require('express-validator');
const {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionStats
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');
const { validateRequest } = require('../middleware/validation');
const { PERMISSIONS } = require('../config/roles');
const { ALL_CATEGORIES, TRANSACTION_TYPES } = require('../config/constants');
const { transactionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation rules
const transactionValidation = [
    body('amount')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('type')
        .isIn(Object.values(TRANSACTION_TYPES)).withMessage('Invalid transaction type'),
    body('category')
        .isIn(ALL_CATEGORIES).withMessage('Invalid category'),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    body('notes')
        .optional()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

const idValidation = [
    param('id')
        .isMongoId().withMessage('Invalid transaction ID format')
];

const filterValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type')
        .optional()
        .isIn(Object.values(TRANSACTION_TYPES)).withMessage('Invalid transaction type'),
    query('category')
        .optional()
        .isIn(ALL_CATEGORIES).withMessage('Invalid category'),
    query('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date'),
    query('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date')
];

// All routes require authentication
router.use(protect);

// Routes with different permission levels
router.get('/', filterValidation, validateRequest, 
    checkPermission(PERMISSIONS.VIEW_TRANSACTIONS), 
    getTransactions
);

router.get('/stats/summary', 
    checkPermission(PERMISSIONS.VIEW_TRANSACTIONS), 
    getTransactionStats
);

router.get('/:id', idValidation, validateRequest,
    checkPermission(PERMISSIONS.VIEW_TRANSACTIONS),
    getTransaction
);

router.post('/', 
    checkPermission(PERMISSIONS.CREATE_TRANSACTION),
    transactionLimiter,
    transactionValidation,
    validateRequest,
    createTransaction
);

router.put('/:id', 
    [...idValidation, ...transactionValidation],
    validateRequest,
    checkPermission(PERMISSIONS.UPDATE_TRANSACTION),
    updateTransaction
);

router.delete('/:id', 
    idValidation,
    validateRequest,
    checkPermission(PERMISSIONS.DELETE_TRANSACTION),
    deleteTransaction
);

module.exports = router;