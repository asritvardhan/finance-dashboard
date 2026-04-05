const mongoose = require('mongoose');
const { TRANSACTION_TYPES, ALL_CATEGORIES } = require('../config/constants');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0'],
        max: [999999999, 'Amount is too large']
    },
    type: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: Object.values(TRANSACTION_TYPES)
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ALL_CATEGORIES
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now,
        index: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
        default: ''
    },
    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    attachment: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
    return `${this.type === 'income' ? '+' : '-'}$${this.amount.toFixed(2)}`;
});

// Middleware to exclude soft-deleted records by default
transactionSchema.pre(/^find/, function() {
    this.where({ isDeleted: false });
});

module.exports = mongoose.model('Transaction', transactionSchema);