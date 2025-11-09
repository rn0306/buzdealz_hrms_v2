const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization') || req.headers.authorization;
    const token = header?.replace('Bearer ', '') || (header && header.split(' ')[1]);
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id || decoded.userId || decoded.user_id);
    if (!user) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const role = await Role.findByPk(req.user.role_id);
      if (!role) return res.status(403).json({ error: 'Access denied' });
      if (!allowedRoles.includes(role.code)) return res.status(403).json({ error: 'Access denied' });
      next();
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  };
};

module.exports = { auth, checkRole };
