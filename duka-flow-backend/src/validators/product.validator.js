'use strict';
const { body, param, query } = require('express-validator');

module.exports = {
  // Create a new product
  create: [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('categoryId').isUUID().withMessage('Valid category ID required'),
    body('subcategory').optional().trim(),
    body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price cannot be negative').isDecimal({ decimal_digits: '0,2' }),
    body('salePrice').isFloat({ min: 0 }).withMessage('Sale price cannot be negative').isDecimal({ decimal_digits: '0,2' }),
    body('taxRate').optional().isFloat({ min: 0 }).isDecimal({ decimal_digits: '0,2' }),
    body('unit').optional().trim().notEmpty(),
    body('barcode').optional().trim(),
    body('description').optional().trim(),
    body('currentStock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('lowStockThreshold').optional().isInt({ min: 0 }),
    // Promotion fields
    body('isPromotion').optional().isBoolean(),
    body('promoPrice').optional().isFloat({ min: 0 }).withMessage('Promo price cannot be negative').isDecimal({ decimal_digits: '0,2' }),
    body('promoStartAt').optional().isISO8601().withMessage('promoStartAt must be ISO 8601 date'),
    body('promoEndAt').optional().isISO8601().withMessage('promoEndAt must be ISO 8601 date'),
    // Custom: promoPrice required if isPromotion=true
    body('promoPrice').if(body('isPromotion').equals('true'))
      .notEmpty().withMessage('promoPrice is required when isPromotion is true'),
  ],

  // Update product
  update: [
    param('productId').isUUID().withMessage('Valid product ID required'),
    body('name').optional().trim().notEmpty(),
    body('categoryId').optional().isUUID(),
    body('subcategory').optional().trim(),
    body('purchasePrice').optional().isFloat({ min: 0 }).isDecimal({ decimal_digits: '0,2' }),
    body('salePrice').optional().isFloat({ min: 0 }).isDecimal({ decimal_digits: '0,2' }),
    body('taxRate').optional().isFloat({ min: 0 }).isDecimal({ decimal_digits: '0,2' }),
    body('unit').optional().trim().notEmpty(),
    body('barcode').optional().trim(),
    body('description').optional().trim(),
    body('lowStockThreshold').optional().isInt({ min: 0 }),
    body('isPromotion').optional().isBoolean(),
    body('promoPrice').optional().isFloat({ min: 0 }).isDecimal({ decimal_digits: '0,2' }),
    body('promoStartAt').optional().isISO8601(),
    body('promoEndAt').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ],

  // List products (query filters)
  list: [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('categoryId').optional().isUUID(),
    query('search').optional().trim(),
    query('lowStock').optional().isBoolean(),
    query('isPromotion').optional().isBoolean(),
    query('isActive').optional().isBoolean(),
  ],

  // Single product param
  byId: [
    param('productId').isUUID().withMessage('Valid product ID required'),
  ],
};
