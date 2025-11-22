const express = require('express');
const router = express.Router();
const ExtensionController = require('../controllers/extensionController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Request extension for an intern
router.post('/', auth, checkRole('ADMIN', 'RECRUITER', 'MANAGER'), ExtensionController.requestExtension);

// Get extensions for a specific user
router.get('/user/:user_id', auth, ExtensionController.getExtensionsByUser);

// Update extension status (approve/reject)
router.put('/:id', auth, checkRole('ADMIN', 'RECRUITER'), ExtensionController.updateExtensionStatus);

module.exports = router;
