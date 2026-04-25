'use strict';

/**
 * pagination — Parses query params and builds Prisma-compatible skip/take + meta.
 *
 * @param {object} query       - Express req.query
 * @param {number} total       - Total number of matching records (from count query)
 * @returns {{ skip: number, take: number, meta: object }}
 */
const paginate = (query, total = 0) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    const meta = {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };

    return { skip, take: limit, meta };
};

module.exports = { paginate };
