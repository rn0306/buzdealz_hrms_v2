// routes/notificationsRoutes.js
const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { auth } = require('../middleware/authMiddleware');


// Create notification (manager sends warning)
router.post('/', auth, notificationsController.create);

// Get notifications for current user
router.get('/', auth, notificationsController.list);

// Get unread count
router.get('/count', auth, notificationsController.getUnreadCount);

// Get single notification
router.get('/:id', auth, notificationsController.getById);

// Mark as read
router.put('/:id/read', auth, notificationsController.markRead);

// Mark as unread
router.put('/:id/unread', auth, notificationsController.markUnread);

// Mark all as read
router.put('/all/read', auth, notificationsController.markAllAsRead);

// Get notifications by target (audit)
router.get('/target/:target_id', auth, notificationsController.getByTarget);

// Delete notification
router.delete('/:id', auth, notificationsController.delete);

module.exports = router;
