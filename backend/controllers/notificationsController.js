// controllers/notificationsController.js
const { Notification, User, EmployeeTarget, TargetsMaster } = require('../models');
const { sendMail } = require('../utils/emailService');
const { getNotificationEmailTemplate } = require('../utils/notificationEmailTemplates');

module.exports = {
  // Create notification (manager sends warning)
  async create(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth required' });

      const { to_user_id, target_id, type = 'warning', title, message, meta } = req.body;

      // Validation
      if (!to_user_id || !message) {
        return res.status(400).json({ error: 'to_user_id and message are required' });
      }

      // Permission check: if manager, ensure to_user_id is one of manager's interns
      if (req.user.Role && req.user.Role.code === 'MANAGER') {
        const targetUser = await User.findByPk(to_user_id);
        if (!targetUser) {
          return res.status(404).json({ error: 'Target user not found' });
        }
        // Verify manager is responsible for this intern
        if (String(targetUser.manager_id) !== String(req.user.id)) {
          return res.status(403).json({ error: 'You can only warn your interns' });
        }
      }

      // Create notification
      const notification = await Notification.create({
        to_user_id,
        from_user_id: req.user.id,
        target_id,
        type,
        title,
        message,
        meta,
      });

      // Fetch full notification with relationships
      const fullNotification = await Notification.findByPk(notification.id, {
        include: [
          { model: User, as: 'recipient', attributes: ['id', 'fname', 'lname', 'email'] },
          { model: User, as: 'sender', attributes: ['id', 'fname', 'lname', 'email'] },
          { model: EmployeeTarget, as: 'target', attributes: ['id', 'start_date', 'end_date'] },
        ],
      });

      // Real-time push (Socket.IO)
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${to_user_id}`).emit('notification:new', {
          notification: fullNotification,
        });
      }

      // Send email notification
      if (fullNotification.recipient && fullNotification.sender) {
        try {
          const senderName = `${fullNotification.sender.fname} ${fullNotification.sender.lname}`.trim();
          const recipientName = `${fullNotification.recipient.fname} ${fullNotification.recipient.lname}`.trim();
          const emailTemplate = getNotificationEmailTemplate(fullNotification, recipientName, senderName);
          
          await sendMail(
            fullNotification.recipient.email,
            `${fullNotification.title || 'New Notification'} - HRMS System`,
            emailTemplate,
            'HRMS System'
          );
        } catch (emailErr) {
          console.warn('Failed to send email notification:', emailErr.message);
          // Don't fail the API call if email fails
        }
      }

      return res.status(201).json({
        message: 'Notification sent successfully',
        data: fullNotification,
      });
    } catch (err) {
      console.error('Error creating notification:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  },

  // List notifications for current user
  async list(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth required' });

      const { unread, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const where = { to_user_id: req.user.id };
      if (unread === 'true') {
        where.is_read = false;
      }

      const { count, rows } = await Notification.findAndCountAll({
        where,
        include: [
          { model: User, as: 'sender', attributes: ['id', 'fname', 'lname', 'email'] },
          { model: EmployeeTarget, as: 'target', attributes: ['id', 'start_date', 'end_date'] },
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit),
      });

      return res.json({
        notifications: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  },

  // Get single notification
  async getById(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth required' });

      const { id } = req.params;

      const notification = await Notification.findByPk(id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'fname', 'lname', 'email'] },
          { model: User, as: 'recipient', attributes: ['id', 'fname', 'lname', 'email'] },
          { model: EmployeeTarget, as: 'target', attributes: ['id', 'start_date', 'end_date'] },
        ],
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Verify ownership
      if (String(notification.to_user_id) !== String(req.user.id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return res.json(notification);
    } catch (err) {
      console.error('Error fetching notification:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  },

  // Mark as read
  async markRead(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth required' });

      const { id } = req.params;

      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Verify ownership
      if (String(notification.to_user_id) !== String(req.user.id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await notification.update({
        is_read: true,
        read_at: new Date(),
      });

      // Emit update via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${req.user.id}`).emit('notification:read', { id });
      }

      return res.json({
        message: 'Notification marked as read',
        data: notification,
      });
    } catch (err) {
      console.error('Error marking notification read:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  },

  // Mark as unread (optional)
  async markUnread(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth required' });

      const { id } = req.params;

      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Verify ownership
      if (String(notification.to_user_id) !== String(req.user.id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await notification.update({
        is_read: false,
        read_at: null,
      });

      return res.json({
        message: 'Notification marked as unread',
        data: notification,
      });
    } catch (err) {
      console.error('Error marking notification unread:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  },

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth required' });

      const count = await Notification.count({
        where: {
          to_user_id: req.user.id,
          is_read: false,
        },
      });

      return res.json({ count });
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  },

  // Mark all as read
  async markAllAsRead(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth required' });

      await Notification.update(
        {
          is_read: true,
          read_at: new Date(),
        },
        {
          where: {
            to_user_id: req.user.id,
            is_read: false,
          },
        }
      );

      const count = await Notification.count({
        where: {
          to_user_id: req.user.id,
          is_read: false,
        },
      });

      // Emit update via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${req.user.id}`).emit('notifications:allRead');
      }

      return res.json({
        message: 'All notifications marked as read',
        remainingUnread: count,
      });
    } catch (err) {
      console.error('Error marking all as read:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  },

  // Get notifications for a specific target (for audit)
  async getByTarget(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth required' });

      const { target_id } = req.params;

      const notifications = await Notification.findAll({
        where: { target_id },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'fname', 'lname', 'email'] },
          { model: User, as: 'recipient', attributes: ['id', 'fname', 'lname', 'email'] },
        ],
        order: [['created_at', 'DESC']],
      });

      return res.json(notifications);
    } catch (err) {
      console.error('Error fetching target notifications:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  },

  // Delete notification (soft delete via archive)
  async delete(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth required' });

      const { id } = req.params;

      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Verify ownership or admin
      if (String(notification.to_user_id) !== String(req.user.id) && req.user.Role?.code !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await notification.destroy();

      return res.json({ message: 'Notification deleted' });
    } catch (err) {
      console.error('Error deleting notification:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  },
};
