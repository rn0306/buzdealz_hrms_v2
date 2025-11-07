const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { email, password, full_name, phone, role_code } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Get role id from role code
      const role = await Role.findOne({ where: { code: role_code } });
      if (!role) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Create new user
      const user = await User.create({
        email,
        password_hash: password, // Will be hashed by model hook
        full_name,
        phone,
        role_id: role.id
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role_code
        },
        token
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ 
        where: { email },
        include: [{
          model: Role,
          attributes: ['code', 'name']
        }]
      });

      if (!user || user.status !== 'active') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.Role
        },
        token
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get current user profile
  static async profile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          attributes: ['code', 'name']
        }],
        attributes: { exclude: ['password_hash'] }
      });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = AuthController;