const { User, PersonalDetail, Role } = require('../models');

class CandidateController {
  // List users (previously candidates)
  static async list(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
        include: [
          { model: PersonalDetail, as: 'personalDetail' },
          {
            model: Role,
            as: 'Role',
            where: { code: 'INTERN' },
            attributes: ['code']
          }
        ],
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get single user by id
  static async get(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [{ model: PersonalDetail, as: 'personalDetail' }],
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Create a new user
  static async create(req, res) {
    try {
      const payload = req.body || {};

      // Accept either `password` or `password_hash` in payload
      if (payload.password) payload.password_hash = payload.password;

      const allowed = [
        'email',
        'password_hash',
        'role_id',
        'recruiter_id',
        'manager_id',
        'fname',
        'mname',
        'lname',
        'joining_date',
        'confirmation_date',
        'date_of_birth',
        'date_of_departure',
        'created_by',
        'updated_by',
      ];

      const data = {};
      for (const k of allowed) if (payload[k] !== undefined) data[k] = payload[k];

      // basic validation
      if (!data.email || !data.fname || !data.lname || !data.role_id) {
        return res.status(400).json({ error: 'email, fname, lname and role_id are required' });
      }

      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) return res.status(400).json({ error: 'User with this email already exists' });

      const user = await User.create(data);

      // Return user without password
      const publicUser = await User.findByPk(user.id, { attributes: { exclude: ['password_hash'] } });
      res.status(201).json(publicUser);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update user
  static async update(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const payload = req.body || {};
      if (payload.password) payload.password_hash = payload.password;

      // Prevent updating primary id
      delete payload.id;

      Object.assign(user, payload);
      await user.save();

      const publicUser = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
      res.json({ message: 'User updated', user: publicUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Delete user
  static async remove(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await user.destroy();
      res.json({ message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = CandidateController;
