const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/roleController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Return all roles - accessible to authenticated HR users
router.get('/', auth, checkRole('ADMIN', 'RECRUITER', 'MANAGER'), RoleController.list);

module.exports = router;
