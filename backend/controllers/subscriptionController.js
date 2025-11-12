const  Subscription  = require('../models/Subscription');

class SubscriptionController {
  // GET /api/subscriptions
  static async getAll(req, res) {
    try {
      const subs = await Subscription.findAll({ order: [['created_at', 'DESC']] });
      res.json({ subscriptions: subs });
    } catch (err) {
      console.error('Error fetching subscriptions', err);
      res.status(500).json({ error: 'Unable to fetch subscriptions' });
    }
  }

  // GET /api/subscriptions/:subscriptionId  (lookup by subscription_id field)
  static async getBySubscriptionId(req, res) {
    try {
      const { subscriptionId } = req.params;
      if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId is required' });

      const sub = await Subscription.findOne({ where: { subscription_id: subscriptionId } });
      if (!sub) return res.status(404).json({ error: 'Subscription not found' });

      res.json({ subscription: sub });
    } catch (err) {
      console.error('Error fetching subscription by id', err);
      res.status(500).json({ error: 'Unable to fetch subscription' });
    }
  }
}

module.exports = SubscriptionController;
