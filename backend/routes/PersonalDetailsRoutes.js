const express = require('express');
const router = express.Router();
const PersonalDetailsController = require('../controllers/PersonalDetailsController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// List all personal details (with optional filters)
router.get('/', auth, checkRole('RECRUITER', 'ADMIN', 'MANAGER'), PersonalDetailsController.list);

// Get candidates with filled Aadhaar + PAN (convenience)
router.get('/filled', auth, checkRole('RECRUITER', 'ADMIN', 'MANAGER'), PersonalDetailsController.listFilledCandidates);

// Create personal detail
router.post('/', auth, checkRole('RECRUITER', 'ADMIN', 'MANAGER'), PersonalDetailsController.create);

// Get onboarding details by user id
router.get('/:id', auth, PersonalDetailsController.get);

// Update onboarding details by user id
router.put('/:id', auth, PersonalDetailsController.update);

// Delete personal detail by user id
router.delete('/:id', auth, checkRole('RECRUITER', 'ADMIN'), PersonalDetailsController.remove);

module.exports = router;
