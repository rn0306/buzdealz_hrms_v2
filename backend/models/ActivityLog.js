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
  
  log_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  hours_spent: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },

  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {
  tableName: 'intern_daily_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ActivityLog;