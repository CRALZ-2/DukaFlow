'use strict';
const { prisma } = require('../config/database');
const apiResponse = require('../utils/apiResponse');

/**
 * requireShop — Middleware to scope requests to a valid shop.
 *
 * Reads shopId from: X-Shop-ID header → req.body.shopId → req.params.shopId
 * Verifies user membership via ShopEmployee pivot.
 * Attaches: req.shop, req.shopRole
 * Blocks writes if shop is READ_ONLY (expired subscription).
 */
const requireShop = async (req, res, next) => {
  const shopId = req.headers['x-shop-id'] || req.body.shopId || req.params.shopId;

  if (!shopId) {
    return apiResponse.fail(res, 'Shop ID required. Send X-Shop-ID header or include shopId in body.', null, 400);
  }

  const userId = req.user?.id;
  if (!userId) {
    return apiResponse.fail(res, 'Authentication required', null, 401);
  }

  // Check membership via ShopEmployee pivot
  const membership = await prisma.shopEmployee.findFirst({
    where: {
      userId,
      shopId,
      isActive: true,
      deletedAt: null,
    },
    include: {
      shop: true,
    },
  });

  if (!membership) {
    return apiResponse.fail(res, 'Access denied: You are not a member of this shop', null, 403);
  }

  // Suspended shops: block everything
  if (membership.shop.status === 'SUSPENDED') {
    return apiResponse.fail(res, 'Shop is suspended. Contact support.', null, 403);
  }

  // READ_ONLY shops: block writes, allow reads
  if (membership.shop.status === 'READ_ONLY' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return apiResponse.fail(res, 'Shop is in read-only mode. Renew subscription to continue.', null, 403);
  }

  // Attach shop context to request for downstream use
  req.shop = membership.shop;
  req.shopRole = membership.role; // OWNER, MANAGER, CASHIER

  next();
};

module.exports = requireShop;
