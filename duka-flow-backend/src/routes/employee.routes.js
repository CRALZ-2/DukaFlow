'use strict';
const express = require('express');
const { validate } = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const requireShop = require('../middlewares/requireShop');
const authorize = require('../middlewares/authorize');
const employeeController = require('../controllers/employee.controller');
const employeeValidator = require('../validators/employee.validator');

const router = express.Router();

// ─── Public route — no auth/shop needed ───────────────
// Accept invite (employee sets password from invite link)
router.post(
  '/accept-invite',
  validate(employeeValidator.acceptInvite),
  employeeController.acceptInvite
);

// ─── Shop-scoped routes — require auth + shop context ──
// All routes below share: authenticate → requireShop

// List all employees in the shop
router.get(
  '/',
  authenticate,
  requireShop,
  authorize(['employee:view']),
  employeeController.list
);

// Invite a new employee (OWNER only)
router.post(
  '/invite',
  authenticate,
  requireShop,
  authorize(['employee:invite']),
  validate(employeeValidator.invite),
  employeeController.invite
);

// Update an employee's role (OWNER only)
router.patch(
  '/:employeeId/role',
  authenticate,
  requireShop,
  authorize(['employee:manage']),
  validate(employeeValidator.updateRole),
  employeeController.updateRole
);

// Deactivate an employee — soft delete (OWNER only)
router.delete(
  '/:employeeId',
  authenticate,
  requireShop,
  authorize(['employee:manage']),
  validate(employeeValidator.deactivate),
  employeeController.deactivate
);

module.exports = router;
