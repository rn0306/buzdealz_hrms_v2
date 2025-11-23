// routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentController');

router.get('/document-templates', ctrl.listTemplates);
router.get('/document-templates/:id', ctrl.getTemplate);
router.post('/document-templates', ctrl.createTemplate);
router.put('/document-templates/:id', ctrl.updateTemplate);
router.delete('/document-templates/:id', ctrl.deleteTemplate);

router.post('/documents/generate', ctrl.generateDocument); // returns PDF inline
router.post('/documents/send', ctrl.sendDocument); // send PDF as attachment

module.exports = router;
