'use strict';
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');
const authService = require('../services/auth.service');

module.exports = {
  register: catchAsync(async (req, res) => {
    const userData = { ...req.body, createdBy: req.user?.id || null };
    const user = await authService.register(userData);
    return apiResponse.success(res, 'Registration successful', { user }, null, 201);
  }),
  
  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return apiResponse.success(res, 'Login successful', result);
  }),
  
  changePassword: catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return apiResponse.success(res, 'Password changed successfully');
  }),
  
  requestPasswordReset: catchAsync(async (req, res) => {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    return apiResponse.success(res, 'Reset request processed', result);
  }),
  
  resetPassword: catchAsync(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    return apiResponse.success(res, 'Password reset successfully');
  }),
  
  logout: catchAsync(async (req, res) => {
    // Stateless JWT: client just discards token
    // TODO: Add refresh token blacklist if needed (Phase 3 stub)
    return apiResponse.success(res, 'Logout successful');
  })
};
