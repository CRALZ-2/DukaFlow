'use strict';
/**
 * test_phase3_auth.js — Phase 3 Auth System Smoke Tests
 * Tests: register, login, validation errors, duplicate email
 *
 * Usage: node test_phase3_auth.js
 * Requires: server running on port 3000
 */

const http = require('http');

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
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function run() {
  console.log('══════════════════════════════════════');
  console.log('  PHASE 3 — AUTH SYSTEM SMOKE TESTS  ');
  console.log('══════════════════════════════════════\n');

  const email = `auth-test-${Date.now()}@dukaflow.com`;

  // ── Test 1: Register (valid data) ──────────────────────
  console.log('1. POST /auth/register (valid)');
  const reg = await request('POST', '/api/v1/auth/register', {
    email, password: 'Test1234!', firstName: 'Test', lastName: 'User', gender: 'MALE',
  });
  assert(reg.status === 201, 'Status 201', `got ${reg.status}`);
  assert(reg.body.status === 'success', 'status=success');
  assert(reg.body.data.user.mustChangePassword === true, 'mustChangePassword=true');
  assert(!reg.body.data.user.password, 'password field hidden');

  // ── Test 2: Register duplicate email ───────────────────
  console.log('\n2. POST /auth/register (duplicate email)');
  const dup = await request('POST', '/api/v1/auth/register', {
    email, password: 'Test1234!', firstName: 'Dup', lastName: 'User', gender: 'MALE',
  });
  assert(dup.status === 409, 'Status 409 on duplicate', `got ${dup.status}`);

  // ── Test 3: Register validation errors ─────────────────
  console.log('\n3. POST /auth/register (invalid data)');
  const badReg = await request('POST', '/api/v1/auth/register', { email: 'not-an-email' });
  assert(badReg.status === 400, 'Status 400 on bad data', `got ${badReg.status}`);
  assert(badReg.body.status === 'fail', 'status=fail');
  assert(Array.isArray(badReg.body.data), 'data is array of errors');

  // ── Test 4: Login (valid credentials) ─────────────────
  console.log('\n4. POST /auth/login (valid)');
  const login = await request('POST', '/api/v1/auth/login', { email, password: 'Test1234!' });
  assert(login.status === 200, 'Status 200', `got ${login.status}`);
  assert(login.body.data.tokens?.accessToken, 'accessToken returned');
  assert(login.body.data.tokens?.refreshToken, 'refreshToken returned');
  assert(login.body.data.mustChangePassword === true, 'mustChangePassword=true');

  // ── Test 5: Login wrong password ──────────────────────
  console.log('\n5. POST /auth/login (wrong password)');
  const badLogin = await request('POST', '/api/v1/auth/login', { email, password: 'WrongPass!' });
  assert(badLogin.status === 401, 'Status 401 on wrong password', `got ${badLogin.status}`);

  // ── Test 6: Login non-existent email ──────────────────
  console.log('\n6. POST /auth/login (non-existent email)');
  const noUser = await request('POST', '/api/v1/auth/login', {
    email: 'nobody@nowhere.com', password: 'Test1234!',
  });
  assert(noUser.status === 401, 'Status 401 on unknown email', `got ${noUser.status}`);

  // ── Test 7: Password reset request ───────────────────
  console.log('\n7. POST /auth/password-reset/request');
  const resetReq = await request('POST', '/api/v1/auth/password-reset/request', { email });
  assert(resetReq.status === 200, 'Status 200', `got ${resetReq.status}`);
  const resetToken = resetReq.body.data?.token;
  assert(resetToken, 'Reset token returned (stub)');

  // ── Test 8: Change password (protected) ──────────────
  console.log('\n8. POST /auth/change-password (authenticated)');
  const token = login.body.data.tokens.accessToken;
  const change = await request('POST', '/api/v1/auth/change-password', {
    currentPassword: 'Test1234!',
    newPassword: 'NewPass456!',
    confirmPassword: 'NewPass456!',
  }, { Authorization: `Bearer ${token}` });
  assert(change.status === 200, 'Status 200', `got ${change.status}`);

  // ── Test 9: Logout ────────────────────────────────────
  console.log('\n9. POST /auth/logout');
  const logout = await request('POST', '/api/v1/auth/logout', null, { Authorization: `Bearer ${token}` });
  assert(logout.status === 200, 'Status 200', `got ${logout.status}`);

  // ── Summary ───────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════');
  if (failed > 0) process.exit(1);
}

run().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
