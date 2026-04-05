// Format currency
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Format date
const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
};

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

// Generate random ID
const generateId = (length = 8) => {
    return Math.random().toString(36).substring(2, 2 + length);
};

// Deep clone object
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Sleep/Delay function
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Extract error message
const getErrorMessage = (error) => {
    if (error.message) return error.message;
    if (typeof error === 'string') return error;
    return 'An unknown error occurred';
};

module.exports = {
    formatCurrency,
    formatDate,
    calculatePercentageChange,
    generateId,
    deepClone,
    sleep,
    getErrorMessage
};