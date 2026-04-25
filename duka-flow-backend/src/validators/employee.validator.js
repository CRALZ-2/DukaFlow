'use strict';
const { body, param } = require('express-validator');
const { ROLES } = require('../config/constants');

// Valid employee roles (not SUPER_ADMIN — that's platform-only)
const EMPLOYEE_ROLES = ['MANAGER', 'CASHIER'];

module.exports = {
  // Invite a new employee to the shop
  invite: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role')
      .isIn(EMPLOYEE_ROLES)
      .withMessage(`Role must be one of: ${EMPLOYEE_ROLES.join(', ')}`),
  ],

  // Update an existing employee's role
  updateRole: [
    param('employeeId').isUUID().withMessage('Valid employee ID required'),
    body('role')
      .isIn(EMPLOYEE_ROLES)
      .withMessage(`Role must be one of: ${EMPLOYEE_ROLES.join(', ')}`),
  ],

  // Deactivate an employee (soft delete)
  deactivate: [
    param('employeeId').isUUID().withMessage('Valid employee ID required'),
  ],

  // Accept invite (employee sets their password after invite)
  acceptInvite: [
    body('token').notEmpty().withMessage('Invite token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('confirmPassword')
      .custom((val, { req }) => val === req.body.password)
      .withMessage('Passwords do not match'),
  ],
};
