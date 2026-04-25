// src/validators/auth.validator.js
'use strict';
const { body, param } = require('express-validator');

module.exports = {
  registerStep1: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).optional()
  ],
  
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('confirmPassword').custom((val, { req }) => val === req.body.newPassword)
      .withMessage('Passwords do not match')
  ],
  
  requestPasswordReset: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],
  
  resetPassword: [
    param('token').isLength({ min: 20 }).withMessage('Invalid reset token'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((val, { req }) => val === req.body.newPassword)
      .withMessage('Passwords do not match')
  ]
};