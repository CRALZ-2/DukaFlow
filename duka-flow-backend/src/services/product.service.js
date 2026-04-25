'use strict';
const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');
const { generateSKU } = require('../utils/generateSKU');

// ─── Helpers ──────────────────────────────────────────

/**
 * Resolve the effective selling price for a product.
 * Returns promoPrice if promotion is active, else salePrice.
 */
const resolveEffectivePrice = (product) => {
  const now = new Date();
  if (
    product.isPromotion &&
    product.promoPrice &&
    product.promoStartAt && new Date(product.promoStartAt) <= now &&
    product.promoEndAt && new Date(product.promoEndAt) >= now
  ) {
    return { effectivePrice: product.promoPrice, isOnPromo: true };
  }
  return { effectivePrice: product.salePrice, isOnPromo: false };
};

/**
 * Safe product select — excludes nothing, but adds effectivePrice computed field.
 */
const withEffectivePrice = (product) => ({
  ...product,
  ...resolveEffectivePrice(product),
});

// ─── Service Methods ──────────────────────────────────

module.exports = {
  /**
   * create — Create a new product with auto-generated SKU.
   */
  create: async (shopId, userId, data) => {
    const {
      name, categoryId, subcategory, purchasePrice, salePrice,
      taxRate, unit, barcode, description, currentStock, lowStockThreshold,
      isPromotion, promoPrice, promoStartAt, promoEndAt,
    } = data;

    // Validate category belongs to platform
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new AppError('Category not found', 404);

    const sku = await generateSKU(shopId);

    const product = await prisma.product.create({
      data: {
        shopId,
        categoryId,
        subcategory: subcategory || null,
        name,
        sku,
        barcode: barcode || null,
        description: description || null,
        unit: unit || 'pcs',
        purchasePrice,
        salePrice,
        taxRate: taxRate || 0,
        currentStock: currentStock || 0,
        lowStockThreshold: lowStockThreshold || 5,
        isPromotion: isPromotion || false,
        promoPrice: promoPrice || null,
        promoStartAt: promoStartAt || null,
        promoEndAt: promoEndAt || null,
        isActive: true,
        createdBy: userId,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    // If initial stock provided, log stock movement
    if (currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          shopId,
          type: 'ADDITION',
          quantity: currentStock,
          previousStock: 0,
          newStock: currentStock,
          notes: 'Initial stock on product creation',
          createdBy: userId,
        },
      });
    }

    return withEffectivePrice(product);
  },

  /**
   * list — Paginated product list with filters.
   */
  list: async (shopId, filters = {}) => {
    const {
      page = 1, limit = 20, categoryId, search,
      lowStock, isPromotion, isActive = true,
    } = filters;

    const skip = (page - 1) * limit;
    const where = {
      shopId,
      deletedAt: null,
      isActive: isActive === 'false' ? false : true,
    };

    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = { contains: search };
    if (isPromotion === 'true') where.isPromotion = true;
    if (lowStock === 'true') {
      where.AND = [
        { currentStock: { lte: prisma.product.fields?.lowStockThreshold } },
      ];
      // Use raw comparison instead
      delete where.AND;
      where.currentStock = {}; // handled below with raw
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Filter low stock in-memory (stock <= threshold)
    const filtered = lowStock === 'true'
      ? products.filter(p => p.currentStock <= p.lowStockThreshold)
      : products;

    return {
      products: filtered.map(withEffectivePrice),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * getById — Get a single product with images and stock info.
   */
  getById: async (shopId, productId) => {
    const product = await prisma.product.findFirst({
      where: { id: productId, shopId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      },
    });
    if (!product) throw new AppError('Product not found', 404);
    return withEffectivePrice(product);
  },

  /**
   * update — Partial update of a product.
   */
  update: async (shopId, productId, userId, data) => {
    const product = await prisma.product.findFirst({
      where: { id: productId, shopId, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { ...data, updatedBy: userId },
      include: { category: { select: { id: true, name: true } } },
    });

    return withEffectivePrice(updated);
  },

  /**
   * softDelete — Mark product as deleted (not hard delete).
   */
  softDelete: async (shopId, productId, userId) => {
    const product = await prisma.product.findFirst({
      where: { id: productId, shopId, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404);

    await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), isActive: false, updatedBy: userId },
    });

    return { message: 'Product deleted successfully' };
  },

  /**
   * getStockHistory — Paginated stock movement history for a product.
   */
  getStockHistory: async (shopId, productId, filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const product = await prisma.product.findFirst({
      where: { id: productId, shopId, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404);

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { productId, shopId, deletedAt: null },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where: { productId, shopId, deletedAt: null } }),
    ]);

    return {
      movements,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  },

  resolveEffectivePrice,
  withEffectivePrice,
};
