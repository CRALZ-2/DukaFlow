'use strict';
const { prisma } = require('../config/database');

/**
 * generateSKU — Auto-generate a unique SKU per shop.
 * Format: SHOP-{sequenceNumber padded to 4 digits}
 * Example: SHOP-0001, SHOP-0002, ..., SHOP-9999, SHOP-10000
 *
 * @param {string} shopId
 * @param {object} [tx] — optional Prisma transaction client
 * @returns {Promise<string>}
 */
const generateSKU = async (shopId, tx = null) => {
  const client = tx || prisma;

  // Count existing products for this shop (including soft-deleted for uniqueness)
  const count = await client.product.count({
    where: { shopId },
  });

  const sequence = count + 1;
  const padded = String(sequence).padStart(4, '0');
  const sku = `SHOP-${padded}`;

  // Verify SKU is actually unique (handles race conditions)
  const existing = await client.product.findFirst({
    where: { shopId, sku },
  });

  if (existing) {
    // Collision: use timestamp-based fallback
    return `SHOP-${Date.now().toString(36).toUpperCase()}`;
  }

  return sku;
};

module.exports = { generateSKU };
