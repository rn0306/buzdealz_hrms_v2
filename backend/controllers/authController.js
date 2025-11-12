const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const { PersonalDetail } = require('../models');

class AuthController {
  
  static async register(req, res) {
    try {
      const { email, password, fname, lname, phone, role_code } = req.body;

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

      // Create new user (password will be hashed in model hook)
      const user = await User.create({
        email,
        password_hash: password,
        fname,
        lname,
        phone,
        role_id: role.id,
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          full_name: `${user.fname} ${user.lname || ''}`.trim(),
          role_code,
        },
        token,
      });
    } catch (error) {
      console.error('Register Error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({
        where: { email },
        include: [{
          model: Role,
          attributes: ['code', 'name'],
        }],
      });

      if (!user) {
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
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          full_name: `${user.fname} ${user.lname || ''}`.trim(),
          role: user.Role,
        },
        token,
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(400).json({ error: error.message });
    }
  }


  static async profile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          attributes: ['code', 'name'],
        }],
        attributes: { exclude: ['password_hash'] },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Profile Error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Get all active and verified users for dropdown (employees/candidates)
  static async getActiveVerifiedUsers(req, res) {
    try {
      const users = await User.findAll({
         include: [
          { model: PersonalDetail, as: 'personalDetail',
            where: { verification_status: 'VERIFIED' }, attributes: ['verification_status']
           },
          {
            model: Role,
            as: 'Role',
            where: { code: 'INTERN' },
            attributes: ['code']
          }
        ],
        attributes: ['id', 'fname', 'lname', 'email', 'joining_date'],
        order: [['fname', 'ASC']],
        raw: true,
      });
      // Map to include full name for frontend
      const mappedUsers = users.map((u) => ({
        id: u.id,
        name: `${u.fname} ${u.lname || ''}`.trim(),
        email: u.email,
        joining_date: u.joining_date,
      }));
      res.json(mappedUsers);
    } catch (error) {
      console.error('Get Users Error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
