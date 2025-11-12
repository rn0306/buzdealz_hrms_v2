const express = require('express');
const router = express.Router();
const targetsMasterController = require('../controllers/targetsMasterController');
const { auth } = require('../middleware/authMiddleware');

// Get all active targets for dropdown
router.get('/active/list', auth, targetsMasterController.getActiveTargets);
// Get all targets
router.get('/', auth, targetsMasterController.getAllTargets);
// Get target by ID
router.get('/:id', auth, targetsMasterController.getTargetById);
// Create target
router.post('/', auth,  targetsMasterController.createTarget);
// Update target
router.put('/:id', auth, targetsMasterController.updateTarget);
// Delete target
router.delete('/:id', auth, targetsMasterController.deleteTarget);

module.exports = router;
