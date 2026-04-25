'use strict';
const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');

module.exports = {
  /**
   * batchUpdateStock — Batch update stock levels for multiple products.
   * Uses Prisma $transaction for ACID compliance.
   *
   * @param {string} shopId
   * @param {string} userId
   * @param {Array} updates — Array of { productId, quantity, type, notes }
   */
  batchUpdateStock: async (shopId, userId, updates) => {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError('No updates provided', 400);
    }

    // 1. Fail-fast: Validate all products belong to the shop and exist
    const productIds = updates.map(u => u.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        shopId,
        deletedAt: null
      }
    });

    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found or do not belong to this shop', 404);
    }

    // Map products for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // 2. ACID Transaction
    return await prisma.$transaction(async (tx) => {
      const results = [];

      for (const update of updates) {
        const { productId, quantity, type, notes, location } = update;
        const product = productMap.get(productId);

        const previousStock = product.currentStock;
        const newStock = previousStock + quantity;

        // Check for negative stock if it's a removal or sale
        if (newStock < 0) {
          throw new AppError(`Insufficient stock for product: ${product.name}. Current: ${previousStock}, Requested: ${quantity}`, 400);
        }

        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            currentStock: newStock,
            updatedBy: userId
          }
        });

        // Record stock movement
        const movement = await tx.stockMovement.create({
          data: {
            productId,
            shopId,
            type,
            quantity,
            previousStock,
            newStock,
            location: location || null,
            notes: notes || `Batch update: ${type}`,
            createdBy: userId
          }
        });

        results.push({
          productId,
          sku: product.sku,
          previousStock,
          newStock,
          movementId: movement.id
        });
      }

      return results;
    });
  }
};
