'use strict';

const { PrismaClient } = require('@prisma/client');

// ─── Singleton Pattern ─────────────────────────────────────────────────────────
// Prevent multiple PrismaClient instances in development (hot reload)
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// ─── Graceful Disconnect ───────────────────────────────────────────────────────
async function disconnectPrisma() {
    await prisma.$disconnect();
    console.log('🔌 Prisma disconnected');
}

module.exports = { prisma, disconnectPrisma };
