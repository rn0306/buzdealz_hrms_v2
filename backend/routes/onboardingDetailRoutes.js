const express = require('express');
const router = express.Router();
const OnboardingDetailController = require('../controllers/onboardingDetailController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// ✅ Get candidates with filled Aadhaar + PAN
router.get(
  '/',
  auth,
  checkRole('RECRUITER', 'ADMIN', 'MANAGER'),
  OnboardingDetailController.listFilledCandidates
);

// Get onboarding details by ID
router.get('/:id', auth, checkRole('RECRUITER', 'ADMIN', 'MANAGER'), OnboardingDetailController.get);

// Edit onboarding details
router.put('/:id', auth, checkRole('RECRUITER', 'ADMIN'), OnboardingDetailController.update);

module.exports = router;
