'use strict';

// ═══════════════════════════════════════════════════════
// PLATFORM CONSTANTS — Single Source of Truth
// Phase 2: Enums & Limits | Phase 5: Full Permission Matrix
// ═══════════════════════════════════════════════════════

module.exports = {

  // ─── Roles (hierarchical order) ───────────────────────
  ROLES: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    OWNER: 'OWNER',
    MANAGER: 'MANAGER',
    CASHIER: 'CASHIER',
  },

  // ─── Permission Matrix ────────────────────────────────
  // '*'            = wildcard — all actions on all resources
  // 'resource:*'   = all actions on a specific resource
  // 'resource:action' = specific action on specific resource
  // 'resource:action:own' = action scoped to own records only
  PERMISSIONS: {
    SUPER_ADMIN: ['*'],
    OWNER: [
      'shop:*',
      'product:*',
      'sale:*',
      'expense:*',
      'report:*',
      'employee:*',
      'settings:*',
      'dashboard:*',
      'stock:*',
    ],
    MANAGER: [
      'shop:view',
      'product:create',
      'product:edit',
      'product:view',
      'sale:create',
      'sale:edit',
      'sale:view',
      'expense:*',
      'report:*',
      'dashboard:view',
      'stock:*',
      'employee:view',
      'employee:invite',
    ],
    CASHIER: [
      'sale:create',
      'sale:view:own',
      'product:view',
      'dashboard:view',
      'employee:view',
    ],
  },

  // ─── Subscription Plans ───────────────────────────────
  // -1 = unlimited
  SUBSCRIPTION_PLANS: {
    FREE: {
      maxProducts: 20,
      maxEmployees: 2,
      trialDays: 30,
    },
    PRO: {
      maxProducts: -1,
      maxEmployees: -1,
      trialDays: 0,
    },
    ENTERPRISE: {
      maxProducts: -1,
      maxEmployees: -1,
      trialDays: 0,
    },
  },

  // ─── Resource → Prisma Model Mapping (for plan limit checks) ──
  PLAN_LIMIT_RESOURCES: {
    products: { limitKey: 'maxProducts', model: 'product' },
    employees: { limitKey: 'maxEmployees', model: 'shopEmployee' },
  },

  // ─── Currencies (EAC) ────────────────────────────────
  CURRENCIES: ['BIF', 'KES', 'TZS', 'UGX', 'RWF', 'USD'],

  // ─── Validation Limits (from UI spec) ────────────────
  LIMITS: {
    NIF_LENGTH: 9,
    WHATSAPP_DIGITS: 8,
    WHATSAPP_PREFIX: '+257',
    AGENT_CODE_LENGTH: 4,
    PRODUCT_IMAGES_MAX: 5,
    PRODUCT_IMAGE_SIZE_MB: 5,
    PRODUCT_IMAGE_TYPES: ['image/jpeg', 'image/png'],
  },

  // ─── Standard Error Codes ────────────────────────────
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    DATABASE_ERROR: 'DATABASE_ERROR',
    PLAN_LIMIT_REACHED: 'PLAN_LIMIT_REACHED',
  },

  // TODO Phase 6+: STOCK_MOVEMENT_TYPES, PAYMENT_STATUSES, EXPENSE_TYPES
};
