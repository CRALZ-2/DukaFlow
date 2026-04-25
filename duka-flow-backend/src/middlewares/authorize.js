'use strict';

const apiResponse = require('../utils/apiResponse');
const { hasPermissions } = require('../utils/permissions');

// ═══════════════════════════════════════════════════════
// authorize — Role + Permission Guard Middleware
//
// Usage in routes:
//   router.post('/products', authenticate, requireShop, authorize(['product:create']), controller)
//   router.delete('/products/:id', authenticate, requireShop, authorize(['product:delete']), controller)
//
// Assumes:
//   - authenticate middleware ran → req.user.id exists
//   - requireShop middleware ran  → req.shop exists, req.shopRole is set
// ═══════════════════════════════════════════════════════

/**
 * @param {string[]} requiredPermissions — Array of permissions needed (ALL must match)
 * @returns {Function} Express middleware
 */
const authorize = (requiredPermissions = []) => {
  return (req, res, next) => {
    // 1. Verify authentication ran
    if (!req.user) {
      return apiResponse.fail(res, 'Authentication required', null, 401);
    }

    // 2. Verify shop context exists (requireShop must run before authorize)
    const role = req.shopRole;
    if (!role) {
      return apiResponse.fail(res, 'Shop context required. Use X-Shop-ID header.', null, 400);
    }

    // 3. If no permissions required, just having a role is enough
    if (requiredPermissions.length === 0) {
      return next();
    }

    // 4. Check role against permission matrix
    if (!hasPermissions(role, requiredPermissions)) {
      return apiResponse.fail(
        res,
        `Forbidden: Your role (${role}) does not have permission for this action`,
        { required: requiredPermissions, yourRole: role },
        403
      );
    }

    // 5. Authorized → proceed
    next();
  };
};

module.exports = authorize;
