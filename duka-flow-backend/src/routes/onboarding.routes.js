'use strict';
const express = require('express');
const { validate } = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const onboardingController = require('../controllers/onboarding.controller');
const onboardingValidator = require('../validators/onboarding.validator');

const router = express.Router();

// All onboarding routes require authentication
router.use(authenticate);

// Get onboarding status (to resume multi-step flow or detect existing shop)
router.get('/', onboardingController.getPending);

// Validate agent referral code (optional, called during step 3)
router.post('/validate-agent', onboardingController.validateAgent);

// Complete onboarding — final submission of all 4 steps
router.post('/complete', validate(onboardingValidator.complete), onboardingController.complete);

module.exports = router;
