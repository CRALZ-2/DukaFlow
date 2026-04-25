'use strict';
const { validationResult } = require('express-validator');
const apiResponse = require('../utils/apiResponse');

/**
 * Middleware wrapper for express-validator.
 * Usage: router.post('/route', validate(authValidator.registerStep1), controller)
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validation checks in sequence
    for (const validation of validations) {
      await validation.run(req);
    }

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format errors into readable messages
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      // apiResponse.fail already calls res.status().json() — just return it
      return apiResponse.fail(res, 'Validation failed', formattedErrors, 400);
    }

    // No errors → proceed to controller
    next();
  };
};

module.exports = { validate };