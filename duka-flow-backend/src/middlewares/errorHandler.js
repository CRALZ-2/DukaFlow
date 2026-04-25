'use strict';

const AppError = require('../utils/AppError');

/**
 * errorHandler — Global Express error-handling middleware.
 * Must be registered LAST in app.js (4-argument signature).
 *
 * Handles:
 *  - AppError (operational errors): returns structured JSON with statusCode
 *  - Prisma known request errors (P2002 unique, P2025 not found, etc.)
 *  - Generic/unknown errors: returns 500
 *
 * Response shape:
 * { status: "error"|"fail", message: string, data: null }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // Default values
    let { statusCode = 500, message = 'Internal server error', status = 'error' } = err;

    // ── Prisma error translation ──────────────────────────────────────────────
    if (err.code === 'P2002') {
        // Unique constraint violation
        statusCode = 409;
        status = 'fail';
        const fields = err.meta?.target?.join(', ') || 'field';
        message = `A record with this ${fields} already exists.`;
    } else if (err.code === 'P2025') {
        // Record not found
        statusCode = 404;
        status = 'fail';
        message = err.meta?.cause || 'Record not found.';
    } else if (err.code === 'P2003') {
        // Foreign key constraint
        statusCode = 400;
        status = 'fail';
        message = 'Related record does not exist.';
    }

    // ── JWT errors ────────────────────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        status = 'fail';
        message = 'Invalid token. Please log in again.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        status = 'fail';
        message = 'Your token has expired. Please log in again.';
    }

    // ── Development: include stack trace ─────────────────────────────────────
    if (process.env.NODE_ENV === 'development') {
        console.error('💥 ERROR:', err);
        return res.status(statusCode).json({
            status,
            message,
            data: null,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }

    // ── Production: only expose operational errors ────────────────────────────
    if (err.isOperational) {
        return res.status(statusCode).json({ status, message, data: null });
    }

    // Non-operational / unexpected error — don't leak internals
    console.error('💥 UNEXPECTED ERROR:', err);
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong. Please try again later.',
        data: null,
    });
};

module.exports = errorHandler;
