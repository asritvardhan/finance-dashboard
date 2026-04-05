const express = require('express');
const { body, param } = require('express-validator');
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateUserRole,
    updateUserStatus
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { validateRequest } = require('../middleware/validation');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Validation rules
const userValidation = [
    body('name')
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email')
        .optional()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(Object.values(ROLES)).withMessage('Invalid role')
];

const idValidation = [
    param('id')
        .isMongoId().withMessage('Invalid user ID format')
];

// All routes require authentication and admin role
router.use(protect);
router.use(checkRole(ROLES.ADMIN));

router.get('/', getUsers);
router.get('/:id', idValidation, validateRequest, getUser);
router.post('/', userValidation, validateRequest, createUser);
router.put('/:id', [...idValidation, ...userValidation], validateRequest, updateUser);
router.delete('/:id', idValidation, validateRequest, deleteUser);
router.patch('/:id/role', [
    ...idValidation,
    body('role').isIn(Object.values(ROLES)).withMessage('Invalid role')
], validateRequest, updateUserRole);
router.patch('/:id/status', [
    ...idValidation,
    body('status').isIn(['active', 'inactive']).withMessage('Invalid status')
], validateRequest, updateUserStatus);

module.exports = router;