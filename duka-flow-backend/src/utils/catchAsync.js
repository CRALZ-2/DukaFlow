'use strict';

/**
 * catchAsync — Wraps an async route handler to forward errors to Express next().
 * Eliminates the need for try/catch in every controller.
 *
 * @param {Function} fn - Async express handler (req, res, next) => Promise
 * @returns {Function} Express middleware that catches promise rejections
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
