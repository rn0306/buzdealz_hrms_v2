const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Termination = sequelize.define('Termination', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
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