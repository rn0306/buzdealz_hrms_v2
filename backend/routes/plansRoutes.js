// backend/routes/plansRoutes.js
const express = require('express');
const router = express.Router();
const plansCtrl = require('../controllers/plansController');
const { auth, checkRole } = require('../middleware/authMiddleware');

router.get('/', auth,  plansCtrl.listPlans);
router.get('/:id', auth, plansCtrl.getPlan);
router.post('/', auth, checkRole("ADMIN","MANAGER"), plansCtrl.createPlan);
router.put('/:id', auth, checkRole("ADMIN","MANAGER"), plansCtrl.updatePlan);
router.delete('/:id', auth, checkRole("ADMIN","MANAGER"), plansCtrl.deletePlan);

module.exports = router;
