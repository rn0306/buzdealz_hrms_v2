const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscriptionController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// List subscriptions (ADMIN only)
router.get('/', auth, SubscriptionController.getAll);

// Get subscription by subscription_id (ADMIN only)
router.get('/:subscriptionId', auth, SubscriptionController.getBySubscriptionId);

module.exports = router;
