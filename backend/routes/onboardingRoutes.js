const express = require('express');
const router = express.Router();
const OnboardingController = require('../controllers/onboardingController');
const { auth, checkRole } = require('../middleware/authMiddleware');

 router.get("/presign-resume", auth, OnboardingController.getPresignedResumeUrl);
// Recruiter creates candidate + user (HR only)
router.post('/create-candidate', auth, checkRole('RECRUITER', 'ADMIN'), OnboardingController.createCandidate);

// HR verifies documents and updates candidate with joining date and confirmation date (HR only)
router.post('/verify-and-update/:candidateId', auth, checkRole('RECRUITER', 'ADMIN'), OnboardingController.verifyAndUpdateCandidate);

router.post('/offer-accept/:candidateId', auth, OnboardingController.acceptOfferAuthenticated);

// HR manually send offer letter
router.post('/send-offer/:candidateId', auth, checkRole('RECRUITER', 'ADMIN'), OnboardingController.sendOffer);
// Get latest offer
router.get('/offer/:candidateId', auth, OnboardingController.getOffer);

// Candidate sets password after onboarding using onboarding token
router.post('/set-password/:candidateId', OnboardingController.setPassword);

module.exports = router;
