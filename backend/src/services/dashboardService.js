const Transaction = require('../models/Transaction');
const moment = require('moment');

class DashboardService {
    async getSummary(userId, startDate, endDate) {
        const match = { user: userId };
        
        if (startDate && endDate) {
            match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        
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
        
        return {
            totalIncome: income.total,
            totalExpense: expense.total,
            netBalance: income.total - expense.total,
            incomeCount: income.count,
            expenseCount: expense.count
        };
    }
    
    async getCategoryBreakdown(userId, startDate, endDate) {
        const match = { user: userId };
        
        if (startDate && endDate) {
            match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        
        const breakdown = await Transaction.aggregate([
            { $match: match },
            { $group: {
                _id: { category: '$category', type: '$type' },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }},
            { $sort: { total: -1 } }
        ]);
        
        return breakdown.map(item => ({
            category: item._id.category,
            type: item._id.type,
            total: item.total,
            count: item.count
        }));
    }
    
    async getMonthlyTrends(userId, months = 6) {
        const match = { user: userId };
        
        const trends = await Transaction.aggregate([
            { $match: match },
            { $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' }
                },
                income: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                    }
                },
                expense: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                    }
                }
            }},
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: months },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        return trends.map(trend => ({
            month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
            income: trend.income,
            expense: trend.expense,
            net: trend.income - trend.expense
        }));
    }
}

module.exports = new DashboardService();