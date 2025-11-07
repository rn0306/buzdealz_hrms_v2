const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  entity: {
    type: DataTypes.STRING(50)
  },
  entity_id: {
    type: DataTypes.UUID
  },
  ip_address: {
    type: DataTypes.STRING(50)
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ActivityLog;