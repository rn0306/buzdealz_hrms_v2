const express = require('express');
const router = express.Router();
const CandidateController = require('../controllers/candidateController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// List candidates (HR/Recruiter/Admin)
router.get('/', auth, checkRole('RECRUITER', 'ADMIN', 'MANAGER'), CandidateController.list);

// Get single candidate (HR/Recruiter/Admin)
router.get('/:id', auth, checkRole('RECRUITER', 'ADMIN', 'MANAGER'), CandidateController.get);

// Update candidate
router.put('/:id', auth, checkRole('RECRUITER', 'ADMIN'), CandidateController.update);

// ✅ Update candidate status (for dropdown action)
router.put('/:id/status', auth, checkRole('RECRUITER', 'ADMIN', 'MANAGER'), CandidateController.updateStatus);

// Delete candidate
router.delete('/:id', auth, checkRole('RECRUITER', 'ADMIN'), CandidateController.remove);

module.exports = router;
