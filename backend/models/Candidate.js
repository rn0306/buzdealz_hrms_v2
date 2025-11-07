const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Candidate = sequelize.define('Candidate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  full_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  resume_url: {
    type: DataTypes.TEXT
  },
  source: {
    type: DataTypes.STRING(50),
    defaultValue: 'manual'
  },
  current_stage: {
    type: DataTypes.STRING(50),
    defaultValue: 'New',
    validate: {
      isIn: [['New', 'Shortlisted', 'Selected', 'Onboarded']]
    }
  },
  assigned_recruiter: {
    type: DataTypes.UUID
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Candidate;