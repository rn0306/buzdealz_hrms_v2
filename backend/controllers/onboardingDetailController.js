const { OnboardingDetail, Candidate } = require('../models');
const { Op } = require('sequelize');

class OnboardingDetailController {
  // ✅ Get candidates who are selected and have filled Aadhaar + PAN
  static async listFilledCandidates(req, res) {
    try {
      const candidates = await OnboardingDetail.findAll({
        where: {
          aadhaar_number: { [Op.ne]: null },
          pan_number: { [Op.ne]: null },
          aadhaar_number: { [Op.ne]: '' },
          pan_number: { [Op.ne]: '' }
        },
        include: [
          {
            model: Candidate,
            as: 'candidate',
            where: { current_stage: 'Selected' }, // ✅ only selected candidates
            attributes: ['id', 'full_name', 'email', 'phone', 'current_stage']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json(candidates);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get details by ID
  static async get(req, res) {
    try {
      const { id } = req.params;
      const detail = await OnboardingDetail.findByPk(id);
      if (!detail) return res.status(404).json({ error: 'Onboarding detail not found' });
      res.json(detail);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Edit details
  static async update(req, res) {
    try {
      const { id } = req.params;
      const detail = await OnboardingDetail.findByPk(id);
      if (!detail) return res.status(404).json({ error: 'Onboarding detail not found' });

      const updates = req.body;
      Object.assign(detail, updates);
      await detail.save();

      res.json({ message: 'Onboarding detail updated', detail });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = OnboardingDetailController;
