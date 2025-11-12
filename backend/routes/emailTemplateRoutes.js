// routes/emailTemplateRoutes.js
const express = require('express');
const router = express.Router();
const EmailTemplateController = require('../controllers/emailTemplateController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// All routes protected (HR/Admin roles only)
router.get('/', auth, checkRole('ADMIN', 'RECRUITER'), EmailTemplateController.getAllTemplates);
router.get('/:id', auth, checkRole('ADMIN', 'RECRUITER'), EmailTemplateController.getTemplateById);
router.post('/', auth, checkRole('ADMIN', 'RECRUITER'), EmailTemplateController.createTemplate);
router.put('/:id', auth, checkRole('ADMIN', 'RECRUITER'), EmailTemplateController.updateTemplate);
router.delete('/:id', auth, checkRole('ADMIN', 'RECRUITER'), EmailTemplateController.deleteTemplate);
router.post('/send', auth, checkRole('ADMIN', 'RECRUITER'), EmailTemplateController.sendTemplatedEmail);

module.exports = router;
