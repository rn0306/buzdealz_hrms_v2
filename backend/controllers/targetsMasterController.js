// controllers/targetsMasterController.js
const { TargetsMaster, Plans } = require('../models');
const { Op } = require('sequelize');

class TargetsMasterController {
  // =============================
  // GET ALL TARGETS
  // =============================
  static async getAllTargets(req, res) {
    try {
      const targets = await TargetsMaster.findAll({
        order: [['created_at', 'DESC']]
      });
      return res.json({ data: targets });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch targets' });
    }
  }

  // =============================
  // GET TARGET BY ID
  // =============================
  static async getTargetById(req, res) {
    try {
      const target = await TargetsMaster.findByPk(req.params.id);
      if (!target) return res.status(404).json({ error: 'Target not found' });

      return res.json({ data: target });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch target' });
    }
  }

  // =============================
  // CREATE TARGET (with dynamic plans)
  // =============================
  static async createTarget(req, res) {
    try {
      const userId = req.user.id;

      const {
        target_description,
        plans = {},       // object: { planId: count }
        deadline_days,
        status = 'Active',
      } = req.body;

      // VALIDATION
      if (!target_description || !target_description.trim()) {
        return res.status(400).json({ error: "target_description is required" });
      }

      if (!deadline_days || Number(deadline_days) <= 0) {
        return res.status(400).json({ error: "deadline_days must be a positive number" });
      }

      // Validate plan IDs
      const planIds = Object.keys(plans);
      if (planIds.length > 0) {
        const existingPlans = await Plans.findAll({
          where: { id: { [Op.in]: planIds } },
          attributes: ['id']
        });

        const foundIds = existingPlans.map(p => p.id);
        const missing = planIds.filter(id => !foundIds.includes(id));

        if (missing.length > 0) {
          return res.status(400).json({
            error: `These plan IDs do not exist: ${missing.join(', ')}`
          });
        }
      }

      // CREATE TARGET
      const newTarget = await TargetsMaster.create({
        target_description: target_description.trim(),
        plans,
        deadline_days,
        created_by: userId,
        status
      });

      return res.status(201).json({ data: newTarget });
    } catch (err) {
      console.error("Error creating target:", err);
      return res.status(500).json({ error: 'Failed to create target' });
    }
  }

  // =============================
  // UPDATE TARGET (supports dynamic plans)
  // =============================
  static async updateTarget(req, res) {
    try {
      const target = await TargetsMaster.findByPk(req.params.id);
      if (!target) return res.status(404).json({ error: 'Target not found' });

      const {
        target_description,
        plans,
        deadline_days,
        status,
      } = req.body;

      // VALIDATION
      if (target_description !== undefined && !target_description.trim()) {
        return res.status(400).json({ error: "Invalid target_description" });
      }

      if (deadline_days !== undefined && Number(deadline_days) <= 0) {
        return res.status(400).json({ error: "deadline_days must be positive" });
      }

      // Validate plans if provided
      if (plans !== undefined) {
        const planIds = Object.keys(plans || {});

        if (planIds.length > 0) {
          const existingPlans = await Plans.findAll({
            where: { id: { [Op.in]: planIds } }
          });

          const foundIds = existingPlans.map(p => p.id);
          const missing = planIds.filter(id => !foundIds.includes(id));

          if (missing.length > 0) {
            return res.status(400).json({
              error: `These plan IDs do not exist: ${missing.join(', ')}`
            });
          }
        }

        target.plans = plans;
      }

      if (target_description !== undefined)
        target.target_description = target_description.trim();

      if (deadline_days !== undefined)
        target.deadline_days = deadline_days;

      if (status !== undefined)
        target.status = status;

      await target.save();

      return res.json({ data: target });
    } catch (err) {
      console.error("Update error:", err);
      return res.status(500).json({ error: 'Failed to update target' });
    }
  }

  // =============================
  // DELETE TARGET
  // =============================
  static async deleteTarget(req, res) {
    try {
      const target = await TargetsMaster.findByPk(req.params.id);
      if (!target) return res.status(404).json({ error: 'Target not found' });

      await target.destroy();
      return res.json({ message: 'Target deleted successfully' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete target' });
    }
  }

  // =============================
  // GET ONLY ACTIVE TARGETS
  // =============================
  static async getActiveTargets(req, res) {
    try {
      const targets = await TargetsMaster.findAll({
        where: { status: 'Active' },
        order: [['created_at', 'DESC']]
      });

      return res.json({ data: targets });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch active targets' });
    }
  }
}

module.exports = TargetsMasterController;
