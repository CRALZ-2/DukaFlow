'use strict';

const { prisma } = require('../config/database');
const apiResponse = require('../utils/apiResponse');
const { SUBSCRIPTION_PLANS, PLAN_LIMIT_RESOURCES } = require('../config/constants');

// ═══════════════════════════════════════════════════════
// planLimits — Enforce Subscription Plan Restrictions
//
// Usage in routes:
//   router.post('/products', authenticate, requireShop, authorize(['product:create']), planLimits('products'), controller)
//
// Assumes:
//   - requireShop middleware ran → req.shop exists (with subscriptionPlan field)
//
// Checks:
//   - Count existing records for the shop vs plan limit
//   - Block POST/PUT if limit reached
//   - Allow GET/DELETE always (read/remove don't add records)
// ═══════════════════════════════════════════════════════

/**
 * @param {string} resource — Key from PLAN_LIMIT_RESOURCES ('products' | 'employees')
 * @returns {Function} Express middleware
 */
const planLimits = (resource) => {
  return async (req, res, next) => {
    // Only enforce on create operations (POST)
    if (req.method !== 'POST') {
      return next();
    }

    // 1. Get shop's subscription plan
    const shop = req.shop;
    if (!shop) {
      return apiResponse.fail(res, 'Shop context required', null, 400);
    }

    const planName = shop.subscriptionPlan; // 'FREE', 'PRO', 'ENTERPRISE'
    const planConfig = SUBSCRIPTION_PLANS[planName];
    if (!planConfig) {
      return apiResponse.fail(res, 'Unknown subscription plan', null, 500);
    }

    // 2. Get resource config
    const resourceConfig = PLAN_LIMIT_RESOURCES[resource];
    if (!resourceConfig) {
      // No limit defined for this resource — allow
      return next();
    }

    const maxAllowed = planConfig[resourceConfig.limitKey]; // e.g. 20 for FREE maxProducts

    // 3. -1 means unlimited — skip check
    if (maxAllowed === -1) {
      return next();
    }

    // 4. Count existing records for this shop
    let currentCount = 0;
    try {
      if (resourceConfig.model === 'product') {
        // Product model will exist in Phase 6+
        // For now, use raw count if model exists
        currentCount = await prisma.product?.count({
          where: { shopId: shop.id, deletedAt: null },
        }) ?? 0;
      } else if (resourceConfig.model === 'shopEmployee') {
        currentCount = await prisma.shopEmployee.count({
          where: { shopId: shop.id, isActive: true, deletedAt: null },
        });
      }
    } catch (err) {
      // Model might not exist yet (e.g. Product in Phase 6)
      // Allow the request through — the controller will handle model errors
      return next();
    }

    // 5. Check if limit reached
    if (currentCount >= maxAllowed) {
      return apiResponse.fail(
        res,
        `Plan limit reached: Your ${planName} plan allows a maximum of ${maxAllowed} ${resource}. ` +
        `You currently have ${currentCount}. Upgrade your plan to add more.`,
        {
          plan: planName,
          resource,
          current: currentCount,
          limit: maxAllowed,
        },
        403
      );
    }

    // 6. Under limit → proceed
    next();
  };
};

module.exports = planLimits;
