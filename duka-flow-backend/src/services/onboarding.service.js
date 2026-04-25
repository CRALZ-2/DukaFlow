'use strict';
const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');

module.exports = {
  /**
   * completeOnboarding — 4-step transactional flow.
   * Creates Shop → Updates User profile → Creates ShopEmployee (OWNER).
   * ALL or NOTHING via Prisma $transaction.
   *
   * @param {string} userId
   * @param {object} data — merged payload from all 4 onboarding steps
   * @returns {{ shop, role, message }}
   */
  completeOnboarding: async (userId, data) => {
    const {
      shopName, categoryId, firstName, lastName, gender,
      whatsapp, country, region, city, agentCode, currencyId,
    } = data;

    // Prevent double-onboarding
    const existing = await prisma.shopEmployee.findFirst({
      where: { userId, role: 'OWNER', isActive: true, deletedAt: null },
    });
    if (existing) {
      throw new AppError('You already own a shop. Cannot onboard again.', 409);
    }

    // Validate category and currency exist
    const [category, currency] = await Promise.all([
      prisma.category.findUnique({ where: { id: categoryId } }),
      prisma.currency.findUnique({ where: { id: currencyId } }),
    ]);
    if (!category) throw new AppError('Category not found', 404);
    if (!currency) throw new AppError('Currency not found', 404);

    // ─── Transaction: ALL or NOTHING ────────────────────
    return await prisma.$transaction(async (tx) => {
      // 1. Generate unique slug from shop name
      const baseSlug = shopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      let slug = baseSlug;
      let counter = 1;
      while (await tx.shop.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter++}`;
      }

      // 2. Create the Shop
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          slug,
          categoryId,
          whatsapp,
          country,
          region: region || null,
          city,
          currencyId,
          status: 'ACTIVE',
          subscriptionPlan: 'FREE',
          isTrialPeriod: true,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day trial
          subscriptionStartDate: new Date(),
          referralCode: agentCode || null,
          createdBy: userId,
        },
      });

      // 3. Update User profile (owner details from step 2)
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          gender,
          updatedBy: userId,
        },
      });

      // 4. Create ShopEmployee pivot — user becomes OWNER
      const membership = await tx.shopEmployee.create({
        data: {
          userId,
          shopId: shop.id,
          role: 'OWNER',
          isActive: true,
          createdBy: userId,
        },
      });

      return {
        shop: {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          status: shop.status,
          subscriptionPlan: shop.subscriptionPlan,
          trialEndsAt: shop.trialEndsAt,
        },
        role: membership.role,
        message: 'Onboarding complete. Welcome to DukaFlow!',
      };
    });
  },

  /**
   * getPendingOnboarding — check if user already has a shop.
   */
  getPendingOnboarding: async (userId) => {
    const existing = await prisma.shopEmployee.findFirst({
      where: { userId, isActive: true, deletedAt: null },
      include: {
        shop: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    });

    if (existing) {
      return {
        hasShop: true,
        shop: existing.shop,
        role: existing.role,
      };
    }

    return { hasShop: false, step: 1, data: {} };
  },

  /**
   * validateAgentCode — stub for Phase 4 (full agent system in later phase).
   */
  validateAgentCode: async (agentCode) => {
    if (!agentCode) return { valid: false, message: 'No agent code provided' };

    // TODO Phase 14: Full agent lookup via Agent model
    // For now: accept any 4-char code as valid
    return { valid: true, agentCode };
  },
};
