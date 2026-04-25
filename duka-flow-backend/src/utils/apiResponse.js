'use strict';

/**
 * apiResponse — Standardised JSON response envelope.
 *
 * Response shape (all functions):
 * {
 *   status:  "success" | "fail" | "error",
 *   message: string,
 *   data:    any | null,
 *   meta:    { total, page, limit, totalPages, hasNext, hasPrev } | null
 * }
 *
 * Usage (positional args):
 *   apiResponse.success(res, 'Created', { id: 1 }, { total:1, page:1, limit:20, totalPages:1, hasNext:false, hasPrev:false })
 *   apiResponse.fail(res, 'Not found', null, 404)
 *   apiResponse.error(res, 'Server error', 500)
 */

/**
 * @param {import('express').Response} res
 * @param {string}  message
 * @param {any}     [data=null]
 * @param {object|null} [meta=null]   - { total, page, limit, totalPages, hasNext, hasPrev }
 * @param {number}  [statusCode=200]
 */
const success = (res, message = 'Success', data = null, meta = null, statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data,
        meta,
    });
};

/**
 * @param {import('express').Response} res
 * @param {string}  message
 * @param {any}     [data=null]
 * @param {number}  [statusCode=400]
 */
const fail = (res, message = 'Request failed', data = null, statusCode = 400) => {
    return res.status(statusCode).json({
        status: 'fail',
        message,
        data,
        meta: null,
    });
};

/**
 * @param {import('express').Response} res
 * @param {string}  message
 * @param {number}  [statusCode=500]
 */
const error = (res, message = 'Internal server error', statusCode = 500) => {
    return res.status(statusCode).json({
        status: 'error',
        message,
        data: null,
        meta: null,
    });
};

module.exports = { success, fail, error };
