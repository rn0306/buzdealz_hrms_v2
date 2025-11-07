const express = require('express');
const router = express.Router();
const OnboardingController = require('../controllers/onboardingController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// HR selects candidate as Selected (HR only)
router.post('/select/:candidateId', auth, checkRole('RECRUITER', 'ADMIN'), OnboardingController.selectCandidate);

// Recruiter creates candidate + user (HR only)
router.post('/create-candidate', auth, checkRole('RECRUITER', 'ADMIN'), OnboardingController.createCandidate);

// Candidate uploads documents (public, onboarding token)
router.post('/upload/:candidateId', OnboardingController.uploadDocuments);

// HR verifies documents (HR only)
router.post('/verify/:candidateId', auth, checkRole('RECRUITER', 'ADMIN'), OnboardingController.verifyDocuments);

// Candidate accepts offer (public, onboarding token)
router.post('/accept-offer/:candidateId', OnboardingController.acceptOffer);

// Candidate sets password after onboarding using onboarding token
router.post('/set-password/:candidateId', OnboardingController.setPassword);

module.exports = router;
