'use strict';

require('dotenv').config();

const app = require('./src/app');
const { prisma } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

let server;

async function startServer() {
    try {
        // Verify database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.warn('⚠️  Database connection failed (Normal for Phase 0 if MySQL is not running):', error.message);
    }

    server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
}

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
async function gracefulShutdown(signal) {
    console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);

    if (server) {
        server.close(async () => {
            console.log('🔌 HTTP server closed');
            try {
                await prisma.$disconnect();
                console.log('🔌 Database disconnected');
            } catch (err) {
                console.error('Error disconnecting database:', err);
            }
            process.exit(0);
        });
    } else {
        await prisma.$disconnect();
        process.exit(0);
    }

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();
