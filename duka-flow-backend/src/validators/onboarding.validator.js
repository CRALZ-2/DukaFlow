'use strict';
const { body } = require('express-validator');

// ─── Regex from UI requirements (EXACT) ───────────────
const NIF_REGEX = /^\d{9}$/;               // 9 digits only
const WHATSAPP_REGEX = /^\+257\d{8}$/;     // +257 + exactly 8 digits
const AGENT_CODE_REGEX = /^[A-Za-z0-9]{4}$/; // exactly 4 alphanumeric chars

module.exports = {
  // Step 1: Business Info
  step1: [
    body('shopName').trim().notEmpty().withMessage('Shop name is required'),
    body('categoryId').isUUID().withMessage('Valid category ID required'),
  ],

  // Step 2: Owner Details
  step2: [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Valid gender required'),
    body('nif').optional().matches(NIF_REGEX).withMessage('NIF must be exactly 9 digits'),
  ],

  // Step 3: Contact & Location
  step3: [
    body('whatsapp').matches(WHATSAPP_REGEX).withMessage('WhatsApp must be +257 followed by 8 digits'),
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('region').optional().trim(),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('agentCode').optional().matches(AGENT_CODE_REGEX).withMessage('Agent code must be 4 alphanumeric characters'),
  ],

  // Step 4: Review — no new validation, just confirmation
  step4: [],

  // Complete onboarding (final submission — all steps combined)
  complete: [
    body('shopName').trim().notEmpty().withMessage('Shop name is required'),
    body('categoryId').isUUID().withMessage('Valid category ID required'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Valid gender required'),
    body('nif').optional().matches(NIF_REGEX).withMessage('NIF must be exactly 9 digits'),
    body('whatsapp').matches(WHATSAPP_REGEX).withMessage('WhatsApp must be +257 followed by 8 digits'),
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('region').optional().trim(),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('agentCode').optional().matches(AGENT_CODE_REGEX).withMessage('Agent code must be 4 alphanumeric characters'),
    body('currencyId').isUUID().withMessage('Valid currency ID required'),
  ],
};
