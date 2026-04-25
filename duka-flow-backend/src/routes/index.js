'use strict';

const { Router } = require('express');

// Feature routers (will be implemented in Phase 3+)
const authRoutes = require('./auth.routes');
const onboardingRoutes = require('./onboarding.routes');
const productRoutes = require('./product.routes');
const saleRoutes = require('./sale.routes');
const expenseRoutes = require('./expense.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');
const settingsRoutes = require('./settings.routes');
const employeeRoutes = require('./employee.routes');
const stockRoutes = require('./stock.routes');

const adminRoutes = require('./admin/admin.routes');
const adminShopsRoutes = require('./admin/adminShops.routes');
const adminAgentsRoutes = require('./admin/adminAgents.routes');
const adminAnalyticsRoutes = require('./admin/adminAnalytics.routes');

const router = Router();

// ─── Mount Routes under /api/v1 ───────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/expenses', expenseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/employees', employeeRoutes);
router.use('/stock', stockRoutes);

router.use('/admin', adminRoutes);
router.use('/admin/shops', adminShopsRoutes);
router.use('/admin/agents', adminAgentsRoutes);
router.use('/admin/analytics', adminAnalyticsRoutes);

module.exports = router;
