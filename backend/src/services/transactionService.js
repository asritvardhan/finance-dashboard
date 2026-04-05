const Transaction = require('../models/Transaction');

class TransactionService {
    async getAllTransactions(userId, filters = {}, pagination = {}) {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;
        
        const query = { user: userId, ...filters };
        
        const transactions = await Transaction.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Transaction.countDocuments(query);
        
        return {
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    async getTransactionById(transactionId, userId) {
        const transaction = await Transaction.findOne({
            _id: transactionId,
            user: userId
        });
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        return transaction;
    }
    
    async createTransaction(transactionData) {
        const transaction = await Transaction.create(transactionData);
        return transaction;
    }
    
    async updateTransaction(transactionId, userId, updateData) {
        const transaction = await Transaction.findOneAndUpdate(
            { _id: transactionId, user: userId },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        return transaction;
    }
    
    async deleteTransaction(transactionId, userId, isAdmin = false) {
        if (isAdmin) {
            const transaction = await Transaction.findByIdAndDelete(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            return transaction;
        } else {
            const transaction = await Transaction.findOneAndUpdate(
                { _id: transactionId, user: userId },
                { isDeleted: true },
                { new: true }
            );
            
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            return transaction;
        }
    }
}

module.exports = new TransactionService();