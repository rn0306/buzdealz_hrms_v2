const express = require('express');
const router = express.Router();
const TerminationController = require('../controllers/terminationController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Terminate an intern
router.post('/', auth, checkRole('ADMIN', 'RECRUITER'), TerminationController.terminateIntern);

// Get termination record for a user
router.get('/user/:user_id', auth, TerminationController.getTerminationByUser);

// Check if user is terminated
router.get('/check/:user_id', auth, TerminationController.isTerminated);

module.exports = router;
