const express = require('express');
const router = express.Router();
const InternSubscriptionController = require('../controllers/internSubscriptionController');
const { auth } = require('../middleware/authMiddleware');

// List and create subscriptions (authenticated users)
router.get('/', auth, InternSubscriptionController.list);
// Get submissions for a specific user
router.get('/user/:userId', auth, InternSubscriptionController.listByUser);
router.post('/', auth, InternSubscriptionController.create);

// Delete a submission (owner only enforced in controller)
router.delete('/:id', auth, InternSubscriptionController.remove);

module.exports = router;
