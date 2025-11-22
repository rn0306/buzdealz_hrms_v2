const { Role } = require('../models');

class RoleController {
  static async list(req, res) {
    try {
      const roles = await Role.findAll({ attributes: ['id', 'code', 'name'], order: [['name', 'ASC']] });
      res.json({ success: true, data: roles });
    } catch (err) {
      console.error('Error fetching roles', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = RoleController;
