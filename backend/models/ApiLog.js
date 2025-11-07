const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApiLog = sequelize.define('ApiLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  intern_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  subscription_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  api_response: {
    type: DataTypes.JSONB
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ApiLog;