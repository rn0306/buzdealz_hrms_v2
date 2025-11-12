const express = require('express');
const router = express.Router();
const ctl = require('../controllers/employeeTargetsController');
const { auth, checkRole } = require('../middleware/authMiddleware');

router.get('/', auth, checkRole('ADMIN', 'MANAGER', 'RECRUITER'), ctl.getAll);
router.get('/:id', auth, checkRole('ADMIN', 'MANAGER', 'RECRUITER'), ctl.getById);
router.post('/', auth, checkRole('ADMIN', 'MANAGER'), ctl.create);
router.put('/:id', auth, checkRole('ADMIN', 'MANAGER'), ctl.update);
router.delete('/:id', auth, checkRole('ADMIN', 'MANAGER'), ctl.delete);

module.exports = router;
