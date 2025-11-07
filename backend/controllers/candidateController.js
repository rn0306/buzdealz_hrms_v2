const { Candidate, User } = require('../models');

class CandidateController {
  static async list(req, res) {
    try {
      const candidates = await Candidate.findAll();
      res.json(candidates);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async get(req, res) {
    try {
      const { id } = req.params;
      const candidate = await Candidate.findByPk(id);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
      res.json(candidate);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const candidate = await Candidate.findByPk(id);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

      const updates = req.body;
      Object.assign(candidate, updates);
      await candidate.save();
      res.json({ message: 'Candidate updated', candidate });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // ✅ New method for updating status only
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { current_stage } = req.body;

      const candidate = await Candidate.findByPk(id);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

      candidate.current_stage = current_stage || 'New';
      await candidate.save();

      res.json({ message: 'Candidate status updated', candidate });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async remove(req, res) {
    try {
      const { id } = req.params;
      const candidate = await Candidate.findByPk(id);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
      await candidate.destroy();
      res.json({ message: 'Candidate deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = CandidateController;
