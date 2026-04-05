// Role definitions and permissions matrix
const ROLES = {
    VIEWER: 'viewer',
    ANALYST: 'analyst',
    ADMIN: 'admin'
};

// Permission definitions
const PERMISSIONS = {
    // Transaction permissions
    CREATE_TRANSACTION: 'create_transaction',
    VIEW_TRANSACTIONS: 'view_transactions',
    UPDATE_TRANSACTION: 'update_transaction',
    DELETE_TRANSACTION: 'delete_transaction',
    
    // User management permissions
    VIEW_USERS: 'view_users',
    CREATE_USER: 'create_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',
    MANAGE_ROLES: 'manage_roles',
    
    // Dashboard permissions
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_ANALYTICS: 'view_analytics'
};

// Role to permissions mapping
const rolePermissions = {
    // Dashboard + analytics only; shared org data via dashboard routes (no transaction CRUD API)
    [ROLES.VIEWER]: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_ANALYTICS],
    [ROLES.ANALYST]: [
        PERMISSIONS.VIEW_TRANSACTIONS,
        PERMISSIONS.CREATE_TRANSACTION,
        PERMISSIONS.UPDATE_TRANSACTION,
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_ANALYTICS
    ],
    [ROLES.ADMIN]: [
        PERMISSIONS.VIEW_TRANSACTIONS,
        PERMISSIONS.CREATE_TRANSACTION,
        PERMISSIONS.UPDATE_TRANSACTION,
        PERMISSIONS.DELETE_TRANSACTION,
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.CREATE_USER,
        PERMISSIONS.UPDATE_USER,
        PERMISSIONS.DELETE_USER,
        PERMISSIONS.MANAGE_ROLES,
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_ANALYTICS
    ]
};

// Check if role has specific permission
const hasPermission = (role, permission) => {
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
};

// Check if role is valid
const isValidRole = (role) => {
    return Object.values(ROLES).includes(role);
};

// Get all roles
const getAllRoles = () => {
    return Object.values(ROLES);
};

module.exports = {
    ROLES,
    PERMISSIONS,
    rolePermissions,
    hasPermission,
    isValidRole,
    getAllRoles
};