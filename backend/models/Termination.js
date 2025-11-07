const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Termination = sequelize.define('Termination', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  intern_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  terminated_by: {
    type: DataTypes.UUID,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'terminated_at',
  updatedAt: false
});

module.exports = Termination;