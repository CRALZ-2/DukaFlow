'use strict';
/**
 * test_phase7_products.js — Phase 7 Products + Stock Smoke Tests
 * Tests: create, list, update, batch stock update, stock history, promotion logic
 *
 * Usage: node tests/test_phase7_products.js
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
  console.log('  PHASE 7 — PRODUCTS + STOCK TESTS       ');
  console.log('══════════════════════════════════════════\n');

  // Setup: create owner + onboard shop
  const email = `prod-owner-${Date.now()}@dukaflow.com`;
  await request('POST', '/api/v1/auth/register', {
    email, password: 'Test1234!', firstName: 'Prod', lastName: 'Owner', gender: 'MALE',
  });
  const loginRes = await request('POST', '/api/v1/auth/login', { email, password: 'Test1234!' });
  const token = loginRes.body.data.tokens.accessToken;

  const cat = await prisma.category.findFirst({ where: { isActive: true } });
  const cur = await prisma.currency.findFirst({ where: { code: 'BIF' } });
  const onboard = await request('POST', '/api/v1/onboarding/complete', {
    shopName: `ProdTest-${Date.now()}`, categoryId: cat.id, firstName: 'Prod', lastName: 'Owner',
    gender: 'MALE', whatsapp: '+25766136218', country: 'Burundi', city: 'Bujumbura', currencyId: cur.id,
  }, { Authorization: `Bearer ${token}` });

  const shopId = onboard.body.data.shop.id;
  const shopHeaders = { Authorization: `Bearer ${token}`, 'X-Shop-ID': shopId };

  // ── Test 1: Create Product ──────────────────────────
  console.log('1. POST /products — create product');
  const prodData = {
    name: 'Test Product 1',
    categoryId: cat.id,
    purchasePrice: 1000,
    salePrice: 1500,
    currentStock: 10,
    unit: 'pcs',
    lowStockThreshold: 5
  };
  const createRes = await request('POST', '/api/v1/products', prodData, shopHeaders);
  console.log(`Status: ${createRes.status}`);
  assert(createRes.status === 201, 'Product created (201)');
  assert(createRes.body.data.sku.startsWith('SHOP-'), 'SKU generated');
  assert(createRes.body.data.currentStock === 10, 'Stock set correctly');
  const productId = createRes.body.data.id;

  // ── Test 2: List Products ───────────────────────────
  console.log('\n2. GET /products — list products');
  const listRes = await request('GET', '/api/v1/products', null, shopHeaders);
  assert(listRes.status === 200, 'List success (200)');
  assert(listRes.body.data.length === 1, 'Product found in list');

  // ── Test 3: Update Product ──────────────────────────
  console.log('\n3. PATCH /products/:id — update product');
  const updateRes = await request('PATCH', `/api/v1/products/${productId}`, { name: 'Updated Product Name' }, shopHeaders);
  assert(updateRes.status === 200, 'Update success (200)');
  assert(updateRes.body.data.name === 'Updated Product Name', 'Name updated');

  // ── Test 4: Batch Stock Update ──────────────────────
  console.log('\n4. POST /stock/batch — batch update');
  const batchData = {
    updates: [
      { productId, quantity: 5, type: 'ADDITION', notes: 'Restocking' }
    ]
  };
  const batchRes = await request('POST', '/api/v1/stock/batch', batchData, shopHeaders);
  if (batchRes.status !== 200) console.log('DEBUG BatchRes Body:', JSON.stringify(batchRes.body, null, 2));
  assert(batchRes.status === 200, 'Batch update success (200)');
  assert(batchRes.body.data[0].newStock === 15, 'Stock increased to 15');

  // ── Test 5: Batch Stock Update (Insufficient) ────────
  console.log('\n5. POST /stock/batch — insufficient stock');
  const badBatchData = {
    updates: [
      { productId, quantity: -20, type: 'REMOVAL', notes: 'Trying to remove more than exists' }
    ]
  };
  const badBatchRes = await request('POST', '/api/v1/stock/batch', badBatchData, shopHeaders);
  assert(badBatchRes.status === 400, 'Fails with 400');
  assert(badBatchRes.body.message.includes('Insufficient stock'), 'Correct error message');

  // ── Test 6: Stock History ───────────────────────────
  console.log('\n6. GET /products/:id/stock-history');
  const historyRes = await request('GET', `/api/v1/products/${productId}/stock-history`, null, shopHeaders);
  assert(historyRes.status === 200, 'History success (200)');
  // Expected 2 movements: 1 from creation (10), 1 from batch addition (5)
  assert(historyRes.body.data.length === 2, 'Two movements recorded');

  // ── Test 7: Promotion Logic ─────────────────────────
  console.log('\n7. Promotion Logic Check');
  const promoProduct = await request('POST', '/api/v1/products', {
    ...prodData,
    name: 'Promo Product',
    isPromotion: true,
    promoPrice: 1200,
    promoStartAt: new Date(Date.now() - 100000).toISOString(),
    promoEndAt: new Date(Date.now() + 100000).toISOString()
  }, shopHeaders);
  assert(promoProduct.body.data.effectivePrice == 1200, 'Effective price is promoPrice');
  assert(promoProduct.body.data.isOnPromo === true, 'isOnPromo is true');

  // ── Test 8: Negative Price Validation ────────────────
  console.log('\n8. Negative Price Validation Check');
  const negativeProduct = await request('POST', '/api/v1/products', {
    ...prodData,
    name: 'Negative Product',
    purchasePrice: -100,
    salePrice: -500,
  }, shopHeaders);
  if (negativeProduct.status !== 400 || !Array.isArray(negativeProduct.body.data)) {
    console.log('DEBUG NegativeProduct Body:', JSON.stringify(negativeProduct.body, null, 2));
  }
  assert(negativeProduct.status === 400, 'Fails with 400 on negative price');
  assert(negativeProduct.body.data && negativeProduct.body.data.some(err => err.msg.includes('cannot be negative')), 'Correct validation message');

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
