'use strict';
/**
 * test_phase6_employees.js — Phase 6 Employee Management Smoke Tests
 * Tests: list, invite, duplicate, accept invite, update role, deactivate, validation
 *
 * Usage: node test_phase6_employees.js
 * Requires: server running on port 3000
 */

const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) { console.log(`  ✅ ${label}`); passed++; }
  else { console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`); failed++; }
}

async function run() {
  console.log('══════════════════════════════════════════');
  console.log('  PHASE 6 — EMPLOYEE MANAGEMENT TESTS    ');
  console.log('══════════════════════════════════════════\n');

  // Setup: create owner + onboard shop
  const email = `owner-${Date.now()}@dukaflow.com`;
  await request('POST', '/api/v1/auth/register', {
    email, password: 'Test1234!', firstName: 'Owner', lastName: 'Test', gender: 'MALE',
  });
  const loginRes = await request('POST', '/api/v1/auth/login', { email, password: 'Test1234!' });
  const token = loginRes.body.data.tokens.accessToken;

  const cat = await prisma.category.findFirst({ where: { isActive: true } });
  const cur = await prisma.currency.findFirst({ where: { code: 'BIF' } });
  const onboard = await request('POST', '/api/v1/onboarding/complete', {
    shopName: `EmpTest-${Date.now()}`, categoryId: cat.id, firstName: 'Owner', lastName: 'Test',
    gender: 'MALE', whatsapp: '+25766136218', country: 'Burundi', city: 'Bujumbura', currencyId: cur.id,
  }, { Authorization: `Bearer ${token}` });

  const shopId = onboard.body.data.shop.id;
  const shopHeaders = { Authorization: `Bearer ${token}`, 'X-Shop-ID': shopId };

  // ── Test 1: List employees (OWNER is member #1) ───────
  console.log('1. GET /employees — initial list');
  const list1 = await request('GET', '/api/v1/employees', null, shopHeaders);
  assert(list1.status === 200, 'Status 200', `got ${list1.status}`);
  assert(list1.body.data.length === 1, '1 employee (OWNER)', `got ${list1.body.data.length}`);
  assert(list1.body.data[0].role === 'OWNER', 'OWNER role');

  // ── Test 2: Invite new CASHIER ────────────────────────
  console.log('\n2. POST /employees/invite — new CASHIER');
  const empEmail = `cashier-${Date.now()}@dukaflow.com`;
  const invite = await request('POST', '/api/v1/employees/invite', {
    email: empEmail, firstName: 'Jane', lastName: 'Cashier', role: 'CASHIER',
  }, shopHeaders);
  assert(invite.status === 201, 'Status 201', `got ${invite.status}: ${JSON.stringify(invite.body)}`);
  assert(invite.body.data.isNewUser === true, 'isNewUser=true');
  assert(invite.body.data.inviteToken, 'inviteToken returned');
  assert(invite.body.data.role === 'CASHIER', 'role=CASHIER');
  const inviteToken = invite.body.data.inviteToken;
  const empId = invite.body.data.employeeId;

  // ── Test 3: FREE plan limit (max 2 = OWNER + CASHIER) ─
  console.log('\n3. POST /employees/invite — FREE plan limit (3rd employee)');
  const overLimit = await request('POST', '/api/v1/employees/invite', {
    email: `third-${Date.now()}@dukaflow.com`, firstName: 'Third', lastName: 'User', role: 'CASHIER',
  }, shopHeaders);
  assert(overLimit.status === 403, 'Status 403 at plan limit', `got ${overLimit.status}`);
  assert(overLimit.body.message?.includes('Plan limit'), 'Plan limit message');

  // ── Test 4: Accept invite ─────────────────────────────
  console.log('\n4. POST /employees/accept-invite');
  const accept = await request('POST', '/api/v1/employees/accept-invite', {
    token: inviteToken, password: 'NewPass123!', confirmPassword: 'NewPass123!',
  });
  assert(accept.status === 200, 'Status 200', `got ${accept.status}`);
  assert(accept.body.message?.includes('accepted'), 'Accepted message');

  // ── Test 5: Employee count = 2 after invite ───────────
  console.log('\n5. GET /employees — after invite');
  const list2 = await request('GET', '/api/v1/employees', null, shopHeaders);
  assert(list2.status === 200, 'Status 200');
  assert(list2.body.data.length === 2, '2 employees', `got ${list2.body.data.length}`);

  // ── Test 6: Update role CASHIER → MANAGER ─────────────
  console.log('\n6. PATCH /employees/:id/role — CASHIER → MANAGER');
  const roleUpdate = await request('PATCH', `/api/v1/employees/${empId}/role`, { role: 'MANAGER' }, shopHeaders);
  assert(roleUpdate.status === 200, 'Status 200', `got ${roleUpdate.status}`);
  assert(roleUpdate.body.data.role === 'MANAGER', 'role=MANAGER');

  // ── Test 7: Block OWNER role change via updateRole ────
  console.log('\n7. PATCH — block OWNER role change');
  const ownerEmpId = list1.body.data[0].id;
  const blockOwner = await request('PATCH', `/api/v1/employees/${ownerEmpId}/role`, { role: 'MANAGER' }, shopHeaders);
  assert(blockOwner.status === 403, 'Status 403 blocking OWNER role change', `got ${blockOwner.status}`);

  // ── Test 8: Deactivate employee (soft delete) ─────────
  console.log('\n8. DELETE /employees/:id — soft delete');
  const deact = await request('DELETE', `/api/v1/employees/${empId}`, null, shopHeaders);
  assert(deact.status === 200, 'Status 200', `got ${deact.status}`);

  // ── Test 9: Employee count back to 1 ──────────────────
  console.log('\n9. GET /employees — after deactivation');
  const list3 = await request('GET', '/api/v1/employees', null, shopHeaders);
  assert(list3.body.data.length === 1, '1 employee after deactivation', `got ${list3.body.data.length}`);

  // ── Test 10: Validation errors ────────────────────────
  console.log('\n10. POST /employees/invite — validation errors');
  const bad = await request('POST', '/api/v1/employees/invite', {
    email: 'not-email', role: 'HACKER',
  }, shopHeaders);
  assert(bad.status === 400, 'Status 400', `got ${bad.status}`);
  assert(Array.isArray(bad.body.data), 'Errors array');

  // ── Test 11: Accept invite — expired/invalid token ────
  console.log('\n11. POST /accept-invite — invalid token');
  const badAccept = await request('POST', '/api/v1/employees/accept-invite', {
    token: 'invalid-token-xyz', password: 'Pass1234!', confirmPassword: 'Pass1234!',
  });
  assert(badAccept.status === 400, 'Status 400 on invalid token', `got ${badAccept.status}`);

  await prisma.$disconnect();
  console.log('\n══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════');
  if (failed > 0) process.exit(1);
}

run().catch(async (e) => {
  console.error('FATAL:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
