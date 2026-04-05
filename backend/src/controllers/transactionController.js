const Transaction = require('../models/Transaction');
const { HTTP_STATUS, PAGINATION } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');
const { orgWideTransactionMatch } = require('../utils/transactionScope');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private (Analyst+)
const getTransactions = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    
    // Build filter object (org-wide for viewer/analyst/admin)
    const filter = orgWideTransactionMatch(req);
    
    // Apply filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.startDate || req.query.endDate) {
        filter.date = {};
        if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
        if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }
    if (req.query.minAmount || req.query.maxAmount) {
        filter.amount = {};
        if (req.query.minAmount) filter.amount.$gte = parseFloat(req.query.minAmount);
        if (req.query.maxAmount) filter.amount.$lte = parseFloat(req.query.maxAmount);
    }
    
    // Search in notes
    if (req.query.search) {
        filter.$or = [
            { notes: { $regex: req.query.search, $options: 'i' } },
            { category: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    
    // Get transactions
    const transactions = await Transaction.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
    
    const total = await Transaction.countDocuments(filter);
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: transactions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        filters: req.query
    });
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private (Analyst+)
const getTransaction = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findOne({
        _id: req.params.id,
        ...orgWideTransactionMatch(req),
    });
    
    if (!transaction) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Transaction not found'
        });
    }
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: transaction
    });
});

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private (Analyst+)
const createTransaction = asyncHandler(async (req, res) => {
    const { amount, type, category, date, notes, tags } = req.body;
    
    const transaction = await Transaction.create({
        user: req.user._id,
        amount,
        type,
        category,
        date: date || Date.now(),
        notes: notes || '',
        tags: tags || []
    });
    
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
    });
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private (Analyst+)
const updateTransaction = asyncHandler(async (req, res) => {
    let transaction = await Transaction.findOne({
        _id: req.params.id,
        ...orgWideTransactionMatch(req),
    });

    if (!transaction) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Transaction not found'
        });
    }

    const { amount, type, category, date, notes, tags } = req.body;
    
    // Update fields
    if (amount) transaction.amount = amount;
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (date) transaction.date = date;
    if (notes !== undefined) transaction.notes = notes;
    if (tags) transaction.tags = tags;
    
    await transaction.save();
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction
    });
});

// @desc    Delete transaction (Soft delete for non-admin, hard delete for admin)
// @route   DELETE /api/transactions/:id
// @access  Private (Admin only for hard delete)
const deleteTransaction = asyncHandler(async (req, res) => {
    let transaction = await Transaction.findOne({
        _id: req.params.id,
        ...orgWideTransactionMatch(req),
    });

    if (!transaction) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Transaction not found'
        });
    }

    // Admin can hard delete, others soft delete
    if (req.user.role === 'admin') {
        await transaction.deleteOne();
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Transaction permanently deleted'
        });
    } else {
        // Soft delete for analysts
        transaction.isDeleted = true;
        await transaction.save();
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    }
});

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats/summary
// @access  Private
const getTransactionStats = asyncHandler(async (req, res) => {
    const match = orgWideTransactionMatch(req);

    // Apply date filter
    if (req.query.startDate || req.query.endDate) {
        match.date = {};
        if (req.query.startDate) match.date.$gte = new Date(req.query.startDate);
        if (req.query.endDate) match.date.$lte = new Date(req.query.endDate);
    }
    
    const stats = await Transaction.aggregate([
        { $match: match },
        { $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            averageAmount: { $avg: '$amount' }
        }}
    ]);
    
    const income = stats.find(s => s._id === 'income') || { totalAmount: 0, count: 0, averageAmount: 0 };
    const expense = stats.find(s => s._id === 'expense') || { totalAmount: 0, count: 0, averageAmount: 0 };
    
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
            income: {
                total: income.totalAmount,
                count: income.count,
                average: income.averageAmount
            },
            expense: {
                total: expense.totalAmount,
                count: expense.count,
                average: expense.averageAmount
            },
            netBalance: income.totalAmount - expense.totalAmount,
            totalTransactions: income.count + expense.count
        }
    });
});

module.exports = {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionStats
};