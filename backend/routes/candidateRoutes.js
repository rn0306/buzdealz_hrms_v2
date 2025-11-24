const express = require('express');
const router = express.Router();
const CandidateController = require('../controllers/candidateController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// List candidates (HR/Recruiter/Admin)
router.get('/', auth, checkRole('RECRUITER', 'ADMIN', 'MANAGER'), CandidateController.list);

// Get single candidate (HR/Recruiter/Admin)
router.get('/:id', auth, checkRole('RECRUITER', 'ADMIN', 'MANAGER'), CandidateController.get);


// Update user
router.put('/:id', auth, checkRole('RECRUITER', 'ADMIN'), CandidateController.updateCandidate);

// Delete user
router.delete('/:id', auth, checkRole('RECRUITER', 'ADMIN'), CandidateController.remove);

module.exports = router;
