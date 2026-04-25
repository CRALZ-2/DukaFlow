'use strict';
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

const SALT_ROUNDS = 12;

module.exports = {
  register: async (userData) => {
    const { email, password, firstName, lastName, gender } = userData;
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user with mustChangePassword = true for new registrations
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        gender,
        mustChangePassword: true, // Force password change on first login
        isActive: true,
        createdBy: userData.createdBy || null
      }
    });
    
    // Remove sensitive fields from response
    const { password: _, ...userSafe } = user;
    return userSafe;
  },
  
  login: async (email, password) => {
    // findFirst (not findUnique) because isActive/deletedAt are non-unique filters
    const user = await prisma.user.findFirst({
      where: { email, isActive: true, deletedAt: null }
    });
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }
    
    // Update login tracking
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 }
      }
    });
    
    // Generate tokens
    // TODO Phase 4+: role comes from ShopEmployee pivot table, not User model
    const tokenPayload = { id: user.id, email: user.email, role: null };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: user.id });
    
    // Remove sensitive fields
    const { password: _, ...userSafe } = user;
    
    return {
      user: userSafe,
      tokens: { accessToken, refreshToken },
      mustChangePassword: user.mustChangePassword
    };
  },
  
  changePassword: async (userId, currentPassword, newPassword) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }
    
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: newPasswordHash,
        mustChangePassword: false, // Clear the flag after successful change
        updatedBy: userId
      }
    });
    
    return { message: 'Password changed successfully' };
  },
  
  requestPasswordReset: async (email) => {
    // findFirst (not findUnique) because isActive is a non-unique filter
    const user = await prisma.user.findFirst({ where: { email, isActive: true, deletedAt: null } });
    if (!user) {
      // Don't reveal if email exists (security)
      return { message: 'If the email exists, a reset link will be sent' };
    }
    
    // Generate reset token (in real app, send email here)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: expiry
      }
    });
    
    // TODO: Send email with reset link (Phase 3 stub)
    return { message: 'Reset instructions sent (stub)', token: resetToken };
  },
  
  resetPassword: async (token, newPassword) => {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
        isActive: true
      }
    });
    
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }
    
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        mustChangePassword: false,
        updatedBy: user.id
      }
    });
    
    return { message: 'Password reset successfully' };
  }
};
