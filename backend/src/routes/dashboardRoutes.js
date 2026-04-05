const express = require('express');
const { query } = require('express-validator');
const {
    getSummary,
    getCategoryBreakdown,
    getTrends,
    getRecentTransactions,
    getDashboardOverview
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');
const { validateRequest } = require('../middleware/validation');
const { PERMISSIONS } = require('../config/roles');

const router = express.Router();

// Validation rules
const dateRangeValidation = [
    query('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    query('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format'),
    query('period')
        .optional()
        .isIn(['week', 'month', 'year']).withMessage('Period must be week, month, or year')
];

// All routes require authentication and dashboard permission
router.use(protect);
router.use(checkPermission(PERMISSIONS.VIEW_DASHBOARD));

router.get('/summary', dateRangeValidation, validateRequest, getSummary);
router.get('/category', dateRangeValidation, validateRequest, getCategoryBreakdown);
router.get('/trends', [
    query('period')
        .optional()
        .isIn(['weekly', 'monthly']).withMessage('Period must be weekly or monthly'),
    query('months')
        .optional()
        .isInt({ min: 1, max: 12 }).withMessage('Months must be between 1 and 12')
], validateRequest, getTrends);
router.get('/recent', getRecentTransactions);
router.get('/overview', dateRangeValidation, validateRequest, getDashboardOverview);

module.exports = router;