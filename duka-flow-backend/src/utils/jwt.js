'use strict';
const jwt = require('jsonwebtoken');

module.exports = {
  signAccessToken: (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
      issuer: 'dukaflow-api',
      audience: 'dukaflow-client'
    });
  },
  
  signRefreshToken: (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      issuer: 'dukaflow-api',
      audience: 'dukaflow-client'
    });
  },
  
  verify: (token, secret) => {
    return jwt.verify(token, secret);
  },
  
  decode: (token) => {
    return jwt.decode(token);
  }
};
