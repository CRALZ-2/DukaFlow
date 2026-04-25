'use strict';
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');
const onboardingService = require('../services/onboarding.service');

module.exports = {
  // GET /api/v1/onboarding — get pending step/data
  getPending: catchAsync(async (req, res) => {
    const result = await onboardingService.getPendingOnboarding(req.user.id);
    return apiResponse.success(res, 'Onboarding status retrieved', result);
  }),

  // POST /api/v1/onboarding/complete — submit all 4 steps at once
  complete: catchAsync(async (req, res) => {
    const result = await onboardingService.completeOnboarding(req.user.id, req.body);
    return apiResponse.success(res, 'Onboarding complete', result, null, 201);
  }),

  // POST /api/v1/onboarding/validate-agent — check referral code
  validateAgent: catchAsync(async (req, res) => {
    const { agentCode } = req.body;
    const result = await onboardingService.validateAgentCode(agentCode);
    return apiResponse.success(res, 'Agent code validation result', result);
  }),
};
