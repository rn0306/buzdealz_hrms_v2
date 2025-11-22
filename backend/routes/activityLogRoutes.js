const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { auth } = require('../middleware/authMiddleware');

router.post('/', auth, activityLogController.create);
router.get('/', auth, activityLogController.myLogs);
router.get('/:date', auth, activityLogController.getByDate);
router.put('/:id', auth, activityLogController.update);

module.exports = router;
