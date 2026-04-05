const Transaction = require('../models/Transaction');
const { HTTP_STATUS } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');
const { orgWideTransactionMatch } = require('../utils/transactionScope');
const moment = require('moment');

// @desc    Get dashboard summary (total income, expense, balance)
// @route   GET /api/dashboard/summary
// @access  Private
const getSummary = asyncHandler(async (req, res) => {
    const { period = 'month', startDate, endDate } = req.query;
    
    let dateFilter = {};
    
    if (startDate && endDate) {
        dateFilter = {
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
    } else {
        // Default to current month if no dates provided
        const now = moment();
        if (period === 'week') {
            dateFilter = {
                date: {
                    $gte: now.startOf('week').toDate(),
                    $lte: now.endOf('week').toDate()
                }
            };
        } else if (period === 'month') {
            dateFilter = {
                date: {
                    $gte: now.startOf('month').toDate(),
                    $lte: now.endOf('month').toDate()
                }
            };
        } else if (period === 'year') {
            dateFilter = {
                date: {
                    $gte: now.startOf('year').toDate(),
                    $lte: now.endOf('year').toDate()
                }
            };
        }
    }
    
    const match = orgWideTransactionMatch(req, dateFilter);
    
    const summary = await Transaction.aggregate([
        { $match: match },
        { $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
        }}
    ]);
    
    const income = summary.find(s => s._id === 'income') || { total: 0, count: 0 };
    const expense = summary.find(s => s._id === 'expense') || { total: 0, count: 0 };
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
            totalIncome: income.total,
            incomeCount: income.count,
            totalExpense: expense.total,
            expenseCount: expense.count,
            netBalance: income.total - expense.total,
            period: period || 'month'
        }
    });
});

// @desc    Get category-wise breakdown
// @route   GET /api/dashboard/category
// @access  Private
const getCategoryBreakdown = asyncHandler(async (req, res) => {
    const { startDate, endDate, type = 'both' } = req.query;
    
    const match = orgWideTransactionMatch(req);

    if (startDate || endDate) {
        match.date = {};
        if (startDate) match.date.$gte = new Date(startDate);
        if (endDate) match.date.$lte = new Date(endDate);
    }

    if (type !== 'both') {
        match.type = type;
    }
    
    const categoryData = await Transaction.aggregate([
        { $match: match },
        { $group: {
            _id: {
                category: '$category',
                type: '$type'
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            average: { $avg: '$amount' }
        }},
        { $sort: { total: -1 } }
    ]);
    
    const formattedData = categoryData.map(item => ({
        category: item._id.category,
        type: item._id.type,
        total: item.total,
        count: item.count,
        average: item.average
    }));
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: formattedData
    });
});

// @desc    Get monthly/weekly trends
// @route   GET /api/dashboard/trends
// @access  Private
const getTrends = asyncHandler(async (req, res) => {
    const { period = 'monthly', months = 6 } = req.query;
    
    const match = orgWideTransactionMatch(req);

    let groupBy;
    let dateFormat;
    
    if (period === 'weekly') {
        groupBy = { week: { $isoWeek: '$date' }, year: { $year: '$date' } };
        dateFormat = '%Y-W%V';
    } else {
        // Monthly
        groupBy = { month: { $month: '$date' }, year: { $year: '$date' } };
        dateFormat = '%Y-%m';
    }
    
    const trends = await Transaction.aggregate([
        { $match: match },
        { $group: {
            _id: groupBy,
            income: {
                $sum: {
                    $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                }
            },
            expense: {
                $sum: {
                    $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                }
            },
            count: { $sum: 1 }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } },
        { $limit: parseInt(months) }
    ]);
    
    const formattedTrends = trends.map(trend => ({
        period: period === 'weekly' 
            ? `Week ${trend._id.week}, ${trend._id.year}`
            : `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
        income: trend.income,
        expense: trend.expense,
        net: trend.income - trend.expense,
        transactions: trend.count
    }));
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: formattedTrends
    });
});

// @desc    Get recent transactions
// @route   GET /api/dashboard/recent
// @access  Private
const getRecentTransactions = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    const transactions = await Transaction.find(orgWideTransactionMatch(req))
        .sort({ date: -1, createdAt: -1 })
        .limit(limit);
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: transactions
    });
});

// @desc    Get complete dashboard data (all in one)
// @route   GET /api/dashboard/overview
// @access  Private
const getDashboardOverview = asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query;
    
    // Get date range for current period
    const now = moment();
    let startDate, endDate;
    
    if (period === 'week') {
        startDate = now.startOf('week').toDate();
        endDate = now.endOf('week').toDate();
    } else if (period === 'month') {
        startDate = now.startOf('month').toDate();
        endDate = now.endOf('month').toDate();
    } else if (period === 'year') {
        startDate = now.startOf('year').toDate();
        endDate = now.endOf('year').toDate();
    }
    
    const match = orgWideTransactionMatch(req, {
        date: { $gte: startDate, $lte: endDate },
    });
    
    // Execute all queries in parallel
    const [summary, categoryData, recentTransactions, previousPeriodSummary] = await Promise.all([
        // Current period summary
        Transaction.aggregate([
            { $match: match },
            { $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }}
        ]),
        
        // Category breakdown
        Transaction.aggregate([
            { $match: match },
            { $group: {
                _id: { category: '$category', type: '$type' },
                total: { $sum: '$amount' }
            }},
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]),
        
        // Recent transactions
        Transaction.find(orgWideTransactionMatch(req))
            .sort({ date: -1 })
            .limit(10),

        // Previous period for comparison
        Transaction.aggregate([
            {
                $match: orgWideTransactionMatch(req, {
                    date: {
                        $gte: moment(startDate).subtract(1, period).toDate(),
                        $lte: startDate,
                    },
                }),
            },
            { $group: {
                _id: '$type',
                total: { $sum: '$amount' }
            }}
        ])
    ]);
    
    const income = summary.find(s => s._id === 'income') || { total: 0, count: 0 };
    const expense = summary.find(s => s._id === 'expense') || { total: 0, count: 0 };
    const prevIncome = previousPeriodSummary.find(s => s._id === 'income') || { total: 0 };
    const prevExpense = previousPeriodSummary.find(s => s._id === 'expense') || { total: 0 };
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
            summary: {
                totalIncome: income.total,
                totalExpense: expense.total,
                netBalance: income.total - expense.total,
                incomeCount: income.count,
                expenseCount: expense.count
            },
            comparison: {
                incomeChange: prevIncome.total ? ((income.total - prevIncome.total) / prevIncome.total * 100).toFixed(1) : 100,
                expenseChange: prevExpense.total ? ((expense.total - prevExpense.total) / prevExpense.total * 100).toFixed(1) : 100
            },
            topCategories: categoryData,
            recentTransactions: recentTransactions,
            period
        }
    });
});

module.exports = {
    getSummary,
    getCategoryBreakdown,
    getTrends,
    getRecentTransactions,
    getDashboardOverview
};