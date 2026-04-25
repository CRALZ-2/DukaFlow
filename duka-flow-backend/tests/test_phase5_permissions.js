'use strict';
/**
 * test_phase5_permissions.js — Phase 5 Permission Matrix Unit Tests
 * Usage: node test_phase5_permissions.js  (NO server needed)
 */
const { hasPermissions, hasAnyPermission, matchPermission, isValidRole, getPermissions } = require('../src/utils/permissions');


let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) { console.log(`  ✅ ${label}`); passed++; }
  else { console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`); failed++; }
}

console.log('══════════════════════════════════════════');
console.log('  PHASE 5 — PERMISSION MATRIX UNIT TESTS ');
console.log('══════════════════════════════════════════\n');

console.log('1. SUPER_ADMIN global wildcard');
assert(hasPermissions('SUPER_ADMIN', ['product:create']), 'product:create');
assert(hasPermissions('SUPER_ADMIN', ['sale:delete', 'anything:here']), 'multi-permission');

console.log('\n2. OWNER resource wildcards');
assert(hasPermissions('OWNER', ['product:create']), 'product:create via product:*');
assert(hasPermissions('OWNER', ['product:delete']), 'product:delete via product:*');
assert(hasPermissions('OWNER', ['employee:invite']), 'employee:invite via employee:*');
assert(hasPermissions('OWNER', ['settings:edit']), 'settings:edit via settings:*');

console.log('\n3. CASHIER restrictions');
assert(hasPermissions('CASHIER', ['sale:create']), 'can create sales');
assert(hasPermissions('CASHIER', ['product:view']), 'can view products');
assert(!hasPermissions('CASHIER', ['product:create']), 'CANNOT create products');
assert(!hasPermissions('CASHIER', ['product:delete']), 'CANNOT delete products');
assert(!hasPermissions('CASHIER', ['expense:create']), 'CANNOT create expenses');
assert(!hasPermissions('CASHIER', ['employee:invite']), 'CANNOT invite employees');
assert(!hasPermissions('CASHIER', ['report:view']), 'CANNOT view reports');

console.log('\n4. MANAGER partial access');
assert(hasPermissions('MANAGER', ['product:create', 'product:edit']), 'can create+edit products');
assert(!hasPermissions('MANAGER', ['product:delete']), 'CANNOT delete products');
assert(hasPermissions('MANAGER', ['expense:create']), 'can create expenses');
assert(hasPermissions('MANAGER', ['employee:view', 'employee:invite']), 'can view+invite employees');
assert(!hasPermissions('MANAGER', ['employee:manage']), 'CANNOT manage employees');
assert(!hasPermissions('MANAGER', ['settings:edit']), 'CANNOT edit settings');

console.log('\n5. hasAnyPermission (OR logic)');
assert(hasAnyPermission('CASHIER', ['product:delete', 'sale:create']), 'has at least sale:create');
assert(!hasAnyPermission('CASHIER', ['product:delete', 'employee:invite']), 'has neither');
assert(hasAnyPermission('MANAGER', ['product:delete', 'product:create']), 'has product:create');

console.log('\n6. matchPermission edge cases');
assert(matchPermission('*', 'anything:here'), '* matches anything');
assert(matchPermission('shop:*', 'shop:view'), 'shop:* matches shop:view');
assert(!matchPermission('shop:*', 'product:view'), 'shop:* does NOT match product:view');
assert(matchPermission('sale:view:own', 'sale:view:own'), 'exact 3-part match');
assert(!matchPermission('sale:view', 'sale:view:own'), 'sale:view != sale:view:own');
assert(!matchPermission('product:create', 'product:delete'), 'create != delete');

console.log('\n7. Invalid role handling');
assert(!hasPermissions('HACKER', ['product:view']), 'unknown role=false');
assert(!hasPermissions(undefined, ['sale:create']), 'undefined role=false');
assert(!isValidRole('HACKER'), 'HACKER not valid');
assert(isValidRole('OWNER'), 'OWNER valid');
assert(isValidRole('MANAGER'), 'MANAGER valid');
assert(isValidRole('CASHIER'), 'CASHIER valid');

console.log('\n8. getPermissions');
assert(Array.isArray(getPermissions('OWNER')) && getPermissions('OWNER').length > 0, 'OWNER perms array');
assert(getPermissions('HACKER').length === 0, 'unknown role = empty array');

console.log('\n══════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════');
if (failed > 0) process.exit(1);
