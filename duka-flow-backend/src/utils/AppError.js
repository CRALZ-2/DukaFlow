'use strict';

/**
 * AppError — Operational error with HTTP status code.
 * Distinguishes operational errors (user/validation) from programming bugs.
 */
class AppError extends Error {
    /**
     * @param {string} message  - Human-readable error message
     * @param {number} statusCode - HTTP status code (4xx / 5xx)
     */
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 500 ? 'error' : 'fail';
        this.isOperational = true;

        // Capture stack trace, excluding constructor call from trace
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
