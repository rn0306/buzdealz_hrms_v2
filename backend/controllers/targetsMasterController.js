const { TargetsMaster } = require('../models'); // ✅ correct import

class TargetsMasterController {
  // Get all targets
  static async getAllTargets(req, res) {
    try {
      const targets = await TargetsMaster.findAll();
      res.json(targets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get target by ID
  static async getTargetById(req, res) {
    try {
      const target = await TargetsMaster.findByPk(req.params.id);
      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }
      res.json(target);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Create target
  static async createTarget(req, res) {
    try {
      const userId = req.user.id; // Get current user ID
      console.log('Creating target by user ID:', userId);
      const data = { ...req.body, created_by: userId };
      const target = await TargetsMaster.create(data);
      res.status(201).json(target);
    } catch (err) {
      console.error('Error creating target:', err);
      res.status(400).json({ error: err.message });
    }
  }

  // Update target
  static async updateTarget(req, res) {
    try {
      const target = await TargetsMaster.findByPk(req.params.id);
      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }
      await target.update(req.body);
      res.json(target);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Delete target
  static async deleteTarget(req, res) {
    try {
      const target = await TargetsMaster.findByPk(req.params.id);
      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }
      await target.destroy();
      res.json({ message: 'Target deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get all active targets for dropdown
  static async getActiveTargets(req, res) {
    try {
      const targets = await TargetsMaster.findAll({
        where: { status: 'Active' },
        order: [['created_at', 'DESC']],
      });
      res.json(targets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = TargetsMasterController;
