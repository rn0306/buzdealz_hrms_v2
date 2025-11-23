const { InternSubscription } = require('../models');
const Subscription = require('../models/Subscription');
const { validateAndProcessSubscription } = require('../utils/targetSubscriptionService');

class InternSubscriptionController {
  // GET /api/intern-subscriptions
  // supports query: subscriptionId, intern_id=current
  static async list(req, res) {
    try {
      const { subscriptionId, intern_id } = req.query;
      const where = {};

      if (subscriptionId) {
        where.subscription_id = subscriptionId;
      }
      if (intern_id === 'current') {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });
        where.user_id = req.user.id;
      }

      const rows = await InternSubscription.findAll({ where, order: [['created_at', 'DESC']] });
      res.json({ data: rows });
    } catch (err) {
      console.error('Error listing intern subscriptions', err);
      res.status(500).json({ error: 'Unable to fetch intern subscriptions' });
    }
  }

  // GET /api/intern-subscriptions/user/:userId
  // Returns all submissions for a specific user id. If requester is not the same user,
  // authentication is still required (caller should be admin or the same user).
  static async listByUser(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      // Allow if requester is same user or at least authenticated (role-based checks can be added)
      // Here we enforce authentication only
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const rows = await InternSubscription.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']] });
      res.json({ data: rows });
    } catch (err) {
      console.error('Error fetching subscriptions for user', err);
      res.status(500).json({ error: 'Unable to fetch submissions for user' });
    }
  }

  // POST /api/intern-subscriptions
  static async create(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const {
        subscriptionId,
        email,
        phone,
        subscriptionPlan,
        proofFileUrl,
        proofFileName,
        status,
      } = req.body;

      // Required fields
      if (!subscriptionId || !subscriptionPlan) {
        return res.status(400).json({ error: 'subscriptionId and subscriptionPlan are required' });
      }

      // Fetch master subscription
      const subscription = await Subscription.findOne({
        where: { subscription_id: subscriptionId }
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Build mismatch list (dynamic)
      const mismatches = [];

      if (email && subscription.email && email !== subscription.email) {
        mismatches.push(`Email does not match.}`);
      }

      if (phone && subscription.phone && phone !== subscription.phone) {
        mismatches.push(`Phone does not match.`);
      }

      if (subscriptionPlan != subscription.subscription_plan) {
        mismatches.push(`Subscription Plan does not match.`);
      }

      // If mismatches detected → return error
      if (mismatches.length > 0) {
        return res.status(400).json({
          error: 'Provided details do not match our subscription records.',
          mismatches,
        });
      }

      // =========================================================
      // NEW: Validate and process subscription with target checks
      // =========================================================
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const validationResult = await validateAndProcessSubscription(
        req.user.id,
        subscriptionId,
        today,
        today
      );

      // If validation failed, return error
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Subscription validation failed',
          details: validationResult.error,
          code: validationResult.code
        });
      }

      // Check if already verified
      if (subscription.verification_status === 'Verified') {
        const record = await InternSubscription.create({
          user_id: req.user.id,
          subscription_id: subscriptionId,
          subscriber_email: email || null,
          subscriber_phone: phone || null,
          subscription_plan: subscriptionPlan,
          proof_file_url: proofFileUrl || null,
          proof_file_name: proofFileName || null,
          validation_status: ("DUPLICATE"),
        });
        return res.status(200).json({
          success: true,
          message: 'This subscription is already verified and cannot be submitted again.',
          data: record,
          targetInfo: validationResult
        });
      }

      // Create the subscription record
      const record = await InternSubscription.create({
        user_id: req.user.id,
        subscription_id: subscriptionId,
        subscriber_email: email || null,
        subscriber_phone: phone || null,
        subscription_plan: subscriptionPlan,
        proof_file_url: proofFileUrl || null,
        proof_file_name: proofFileName || null,
        validation_status: ("VERIFIED"),
      });

      // Update master subscription to verified
      await subscription.update({ verification_status: 'Verified' });

      return res.status(201).json({
        success: true,
        data: record,
        targetInfo: validationResult
      });

    } catch (err) {
      console.error('Error creating intern subscription', err);
      return res.status(500).json({ error: 'Unable to create submission', details: err.message });
    }
  }


  // DELETE /api/intern-subscriptions/:id
  static async remove(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'id required' });
      const rec = await InternSubscription.findByPk(id);
      if (!rec) return res.status(404).json({ error: 'Submission not found' });

      // allow delete if owner or admin
      if (req.user && rec.user_id !== req.user.id) {
        // not owner; require admin role
        const roleId = req.user.role_id;
        // simplistic check: allow only owner for now
        return res.status(403).json({ error: 'Not authorized to delete this submission' });
      }

      await rec.destroy();
      res.json({ message: 'Deleted' });
    } catch (err) {
      console.error('Error deleting intern subscription', err);
      res.status(500).json({ error: 'Unable to delete submission' });
    }
  }
}

module.exports = InternSubscriptionController;
