'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════

// ─── Currencies (EAC Region) ──────────────────────

const currencies = [
  { code: 'BIF', name: 'Burundian Franc', symbol: 'Fbu', isActive: true },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', isActive: true },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', isActive: true },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', isActive: true },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RFr', isActive: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', isActive: true },
];

// ─── Categories (from UI spec, exact order) ───────

const categories = [
  { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
  { name: 'Fashion', slug: 'fashion', description: 'Clothing, shoes, and fashion accessories' },
  { name: 'Spare Parts', slug: 'spare-parts', description: 'Vehicle and machinery spare parts' },
  { name: 'Pharmacy', slug: 'pharmacy', description: 'Pharmaceutical and health products' },
  { name: 'Jewellery', slug: 'jewellery', description: 'Jewellery and precious accessories' },
  { name: 'Clothing', slug: 'clothing', description: 'Apparel and garments' },
  { name: 'Hardware', slug: 'hardware', description: 'Tools, building materials, and hardware supplies' },
  { name: 'Food', slug: 'food', description: 'Food items and groceries' },
  { name: 'Beverage', slug: 'beverage', description: 'Drinks and beverages' },
  { name: 'Transportation', slug: 'transportation', description: 'Transportation services and equipment' },
  { name: 'Others', slug: 'others', description: 'Miscellaneous and uncategorized items' },
];

// ─── Subscription Plans ───────────────────────────

const subscriptionPlans = [
  {
    name: 'FREE',
    description: 'Free starter plan with basic features',
    maxProducts: 20,
    maxEmployees: 2,
    priceMonthly: 0,
    priceYearly: 0,
    features: ['basic_dashboard', 'pos_access', 'stock_tracking'],
    isActive: true,
  },
  {
    name: 'PRO',
    description: 'Professional plan with unlimited access and advanced features',
    maxProducts: -1,
    maxEmployees: -1,
    priceMonthly: 15.00,
    priceYearly: 150.00,
    features: ['unlimited_products', 'unlimited_employees', 'advanced_reports', 'multi_currency', 'agent_commissions'],
    isActive: true,
  },
  {
    name: 'ENTERPRISE',
    description: 'Enterprise plan with white-label, API access, and priority support',
    maxProducts: -1,
    maxEmployees: -1,
    priceMonthly: null,
    priceYearly: null,
    features: ['white_label', 'api_access', 'priority_support'],
    isActive: false,
  },
];

// ═══════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════

async function main() {
  console.log('🌱 Starting seed...\n');

  // ── Seed Currencies ─────────────────────────────
  let currencyCount = 0;
  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
    currencyCount++;
  }
  console.log(`🌱 Seeded ${currencyCount} currencies`);

  // ── Seed Categories ─────────────────────────────
  let categoryCount = 0;
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: { ...category, isActive: true },
    });
    categoryCount++;
  }
  console.log(`🌱 Seeded ${categoryCount} categories`);

  // ── Seed Subscription Plans ─────────────────────
  let planCount = 0;
  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
    planCount++;
  }
  console.log(`🌱 Seeded ${planCount} subscription plans`);

  console.log('\n✅ Seed completed successfully.');
}

// ═══════════════════════════════════════════════════
// EXECUTE
// ═══════════════════════════════════════════════════

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
