'use strict';
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');
const stockService = require('../services/stock.service');

module.exports = {
  // POST /api/v1/stock/batch
  batchUpdate: catchAsync(async (req, res) => {
    const { updates } = req.body;
    const result = await stockService.batchUpdateStock(req.shop.id, req.user.id, updates);
    return apiResponse.success(res, 'Stock batch update successful', result);
  })
};
