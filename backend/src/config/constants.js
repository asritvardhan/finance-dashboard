// Application constants

// Transaction types
const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense'
};

// Transaction categories
const CATEGORIES = {
    INCOME: [
        'Salary',
        'Freelance',
        'Investment',
        'Business',
        'Gift',
        'Other Income'
    ],
    EXPENSE: [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Rent',
        'Insurance',
        'Other Expense'
    ]
};

// All categories combined
const ALL_CATEGORIES = [...CATEGORIES.INCOME, ...CATEGORIES.EXPENSE];

// User status
const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
};

// HTTP status codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Date formats
const DATE_FORMATS = {
    DEFAULT: 'YYYY-MM-DD',
    DISPLAY: 'MMM DD, YYYY',
    API: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};
const ROLES = {
    ADMIN: 'admin',
    ANALYST: 'analyst',
    VIEWER: 'viewer'
};
module.exports = {
    TRANSACTION_TYPES,
    CATEGORIES,
    ALL_CATEGORIES,
    USER_STATUS,
    HTTP_STATUS,
    PAGINATION,
    DATE_FORMATS,
    ROLES
};