// src/routes/auth.routes.js
'use strict';
const express = require('express');
const { validate } = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');

const router = express.Router();

// Public routes
router.post('/register', validate(authValidator.registerStep1), authController.register);
router.post('/login', validate(authValidator.login), authController.login);
router.post('/password-reset/request', validate(authValidator.requestPasswordReset), authController.requestPasswordReset);
router.post('/password-reset/:token', validate(authValidator.resetPassword), authController.resetPassword);

// Protected routes (require valid JWT)
router.post('/change-password', authenticate, validate(authValidator.changePassword), authController.changePassword);
router.post('/logout', authenticate, authController.logout);

module.exports = router;