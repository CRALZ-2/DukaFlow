'use strict';
const crypto = require('crypto');

/**
 * generateInviteToken — Cryptographically secure random token.
 * @returns {string} 64-char hex token
 */
const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex'); // 64 hex chars
};

/**
 * generateInviteExpiry — Token expiry date (default: 7 days).
 * @param {number} days
 * @returns {Date}
 */
const generateInviteExpiry = (days = 7) => {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

/**
 * isInviteExpired — Check if a token expiry date has passed.
 * @param {Date} expiry
 * @returns {boolean}
 */
const isInviteExpired = (expiry) => {
  return !expiry || new Date() > new Date(expiry);
};

module.exports = {
  generateInviteToken,
  generateInviteExpiry,
  isInviteExpired,
};
