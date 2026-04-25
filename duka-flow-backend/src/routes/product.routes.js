'use strict';
const express = require('express');
const { validate } = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const requireShop = require('../middlewares/requireShop');
const authorize = require('../middlewares/authorize');
const planLimits = require('../middlewares/planLimits');
const productController = require('../controllers/product.controller');
const productValidator = require('../validators/product.validator');

const router = express.Router();

// All product routes require authentication and shop context
router.use(authenticate, requireShop);

// List products
router.get(
  '/',
  authorize(['product:view']),
  validate(productValidator.list),
  productController.list
);

// Create product
router.post(
  '/',
  authorize(['product:create']),
  planLimits('products'),
  validate(productValidator.create),
  productController.create
);

// Get product by ID
router.get(
  '/:productId',
  authorize(['product:view']),
  validate(productValidator.byId),
  productController.getById
);

// Update product
router.patch(
  '/:productId',
  authorize(['product:edit']),
  validate(productValidator.update),
  productController.update
);

// Delete product
router.delete(
  '/:productId',
  authorize(['product:delete']),
  validate(productValidator.byId),
  productController.delete
);

// Get stock history for a product
router.get(
  '/:productId/stock-history',
  authorize(['product:view']),
  validate(productValidator.byId),
  productController.getStockHistory
);

module.exports = router;
