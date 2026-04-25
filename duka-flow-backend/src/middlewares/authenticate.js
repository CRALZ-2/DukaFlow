'use strict';
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');

module.exports = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'No token provided',
        data: null,
        meta: null
      });
    }
    
    // Try access token first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
      return next();
    } catch (err) {
      // If access token expired, try refresh token flow
      if (err.name === 'TokenExpiredError') {
        const refreshToken = req.headers['x-refresh-token'];
        if (!refreshToken) {
          return res.status(401).json({
            status: 'fail',
            message: 'Access token expired, no refresh token',
            data: null,
            meta: null
          });
        }
        
        const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: refreshDecoded.id, isActive: true, deletedAt: null }
        });
        
        if (!user) {
          return res.status(401).json({
            status: 'fail',
            message: 'Invalid refresh token',
            data: null,
            meta: null
          });
        }
        
        // Issue new access token
        const newAccessToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        res.setHeader('X-New-Access-Token', newAccessToken);
        req.user = { id: user.id, email: user.email, role: user.role };
        return next();
      }
      throw err;
    }
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired token',
      data: null,
      meta: null
    });
  }
};
