'use strict';
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');
const productService = require('../services/product.service');

module.exports = {
  // GET /api/v1/products
  list: catchAsync(async (req, res) => {
    const result = await productService.list(req.shop.id, req.query);
    return apiResponse.success(res, 'Products retrieved successfully', result.products, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  }),

  // POST /api/v1/products
  create: catchAsync(async (req, res) => {
    const product = await productService.create(req.shop.id, req.user.id, req.body);
    return apiResponse.success(res, 'Product created successfully', product, null, 201);
  }),

  // GET /api/v1/products/:productId
  getById: catchAsync(async (req, res) => {
    const product = await productService.getById(req.shop.id, req.params.productId);
    return apiResponse.success(res, 'Product retrieved successfully', product);
  }),

  // PATCH /api/v1/products/:productId
  update: catchAsync(async (req, res) => {
    const product = await productService.update(req.shop.id, req.params.productId, req.user.id, req.body);
    return apiResponse.success(res, 'Product updated successfully', product);
  }),

  // DELETE /api/v1/products/:productId
  delete: catchAsync(async (req, res) => {
    const result = await productService.softDelete(req.shop.id, req.params.productId, req.user.id);
    return apiResponse.success(res, result.message);
  }),

  // GET /api/v1/products/:productId/stock-history
  getStockHistory: catchAsync(async (req, res) => {
    const result = await productService.getStockHistory(req.shop.id, req.params.productId, req.query);
    return apiResponse.success(res, 'Stock history retrieved successfully', result.movements, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  })
};
