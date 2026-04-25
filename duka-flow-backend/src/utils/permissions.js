'use strict';

const { PERMISSIONS, ROLES } = require('../config/constants');

// ═══════════════════════════════════════════════════════
// Permission Matrix Resolver
// Supports: exact match, resource wildcard, global wildcard
// ═══════════════════════════════════════════════════════

/**
 * Check if a single granted permission satisfies a required permission.
 *
 * Matching rules:
 *   '*'              → matches everything
 *   'product:*'      → matches 'product:create', 'product:edit', 'product:delete', etc.
 *   'product:create' → matches 'product:create' exactly
 *   'sale:view:own'  → matches 'sale:view:own' exactly
 *
 * @param {string} granted  - Permission the role has
 * @param {string} required - Permission the action requires
 * @returns {boolean}
 */
const matchPermission = (granted, required) => {
  // Global wildcard
  if (granted === '*') return true;

  // Exact match
  if (granted === required) return true;

  // Resource wildcard: 'product:*' matches 'product:create'
  if (granted.endsWith(':*')) {
    const grantedResource = granted.slice(0, -2); // 'product'
    return required.startsWith(grantedResource + ':');
  }

  return false;
};

/**
 * Check if a role has ALL of the required permissions.
 *
 * @param {string} role        - User role (SUPER_ADMIN, OWNER, MANAGER, CASHIER)
 * @param {string[]} required  - Array of required permissions
 * @returns {boolean}
 */
const hasPermissions = (role, required) => {
  const granted = PERMISSIONS[role];
  if (!granted) return false;

  return required.every((req) =>
    granted.some((g) => matchPermission(g, req))
  );
};

/**
 * Check if a role has ANY of the required permissions.
 *
 * @param {string} role        - User role
 * @param {string[]} required  - Array of permissions (at least one must match)
 * @returns {boolean}
 */
const hasAnyPermission = (role, required) => {
  const granted = PERMISSIONS[role];
  if (!granted) return false;

  return required.some((req) =>
    granted.some((g) => matchPermission(g, req))
  );
};

/**
 * Get all permissions for a role.
 *
 * @param {string} role
 * @returns {string[]}
 */
const getPermissions = (role) => {
  return PERMISSIONS[role] || [];
};

/**
 * Check if a role is valid.
 *
 * @param {string} role
 * @returns {boolean}
 */
const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

module.exports = {
  matchPermission,
  hasPermissions,
  hasAnyPermission,
  getPermissions,
  isValidRole,
};
