'use strict';
const express = require('express');
const { validate } = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const requireShop = require('../middlewares/requireShop');
const authorize = require('../middlewares/authorize');
const stockController = require('../controllers/stock.controller');

const router = express.Router();

// All stock routes require authentication and shop context
router.use(authenticate, requireShop);

// Batch stock update
router.post(
  '/batch',
  authorize(['stock:manage']),
  stockController.batchUpdate
);

module.exports = router;
