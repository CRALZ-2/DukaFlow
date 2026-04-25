'use strict';
/**
 * test_phase4_onboarding.js — Phase 4 Onboarding Smoke Tests
 * Tests: register, login, onboarding status, complete onboarding, duplicate prevention, validation
 *
 * Usage: node test_phase4_onboarding.js
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
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function run() {
  console.log('══════════════════════════════════════════');
  console.log('  PHASE 4 — ONBOARDING SMOKE TESTS       ');
  console.log('══════════════════════════════════════════\n');

  // Seed data
  const cat = await prisma.category.findFirst({ where: { isActive: true } });
  const cur = await prisma.currency.findFirst({ where: { code: 'BIF' } });
  assert(cat, 'Category seed exists');
  assert(cur, 'BIF currency seed exists');

  // Setup user
  const email = `onboard-test-${Date.now()}@dukaflow.com`;
  await request('POST', '/api/v1/auth/register', {
    email, password: 'Test1234!', firstName: 'Onboard', lastName: 'User', gender: 'FEMALE',
  });
  const loginRes = await request('POST', '/api/v1/auth/login', { email, password: 'Test1234!' });
  const token = loginRes.body.data.tokens.accessToken;
  const authHeader = { Authorization: `Bearer ${token}` };

  // ── Test 1: GET /onboarding — no shop yet ─────────────
  console.log('\n1. GET /onboarding (before)');
  const before = await request('GET', '/api/v1/onboarding', null, authHeader);
  assert(before.status === 200, 'Status 200', `got ${before.status}`);
  assert(before.body.data.hasShop === false, 'hasShop=false');

  // ── Test 2: POST /onboarding/complete (valid) ─────────
  console.log('\n2. POST /onboarding/complete (valid)');
  const onboard = await request('POST', '/api/v1/onboarding/complete', {
    shopName: `Test Shop ${Date.now()}`,
    categoryId: cat.id,
    firstName: 'Onboard',
    lastName: 'Owner',
    gender: 'MALE',
    whatsapp: '+25766136218',
    country: 'Burundi',
    city: 'Bujumbura',
    currencyId: cur.id,
  }, authHeader);
  assert(onboard.status === 201, 'Status 201', `got ${onboard.status}: ${JSON.stringify(onboard.body)}`);
  assert(onboard.body.data.shop?.id, 'Shop ID returned');
  assert(onboard.body.data.shop?.status === 'ACTIVE', 'Shop status=ACTIVE');
  assert(onboard.body.data.role === 'OWNER', 'role=OWNER');
  assert(onboard.body.data.shop?.subscriptionPlan === 'FREE', 'Plan=FREE');
  assert(onboard.body.data.shop?.trialEndsAt, 'trialEndsAt set');

  // ── Test 3: GET /onboarding — has shop now ────────────
  console.log('\n3. GET /onboarding (after)');
  const after = await request('GET', '/api/v1/onboarding', null, authHeader);
  assert(after.status === 200, 'Status 200');
  assert(after.body.data.hasShop === true, 'hasShop=true');
  assert(after.body.data.role === 'OWNER', 'role=OWNER');

  // ── Test 4: Double onboarding blocked ────────────────
  console.log('\n4. POST /onboarding/complete (duplicate — should fail)');
  const dup = await request('POST', '/api/v1/onboarding/complete', {
    shopName: 'Duplicate Shop',
    categoryId: cat.id,
    firstName: 'Dup',
    lastName: 'Owner',
    gender: 'MALE',
    whatsapp: '+25766136218',
    country: 'Burundi',
    city: 'Bujumbura',
    currencyId: cur.id,
  }, authHeader);
  assert(dup.status === 409, 'Status 409 on duplicate', `got ${dup.status}`);

  // ── Test 5: Validation errors ─────────────────────────
  console.log('\n5. POST /onboarding/complete (bad data)');
  const bad = await request('POST', '/api/v1/onboarding/complete', {
    shopName: '',
    whatsapp: '123',
    country: '',
  }, authHeader);
  assert(bad.status === 400, 'Status 400', `got ${bad.status}`);
  assert(Array.isArray(bad.body.data), 'Errors array returned');
  assert(bad.body.data.length >= 4, `≥4 validation errors, got ${bad.body.data.length}`);

  // ── Test 6: Unauthenticated request blocked ───────────
  console.log('\n6. GET /onboarding (no token)');
  const noAuth = await request('GET', '/api/v1/onboarding');
  assert(noAuth.status === 401, 'Status 401 without token', `got ${noAuth.status}`);

  // ── Summary ───────────────────────────────────────────
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
