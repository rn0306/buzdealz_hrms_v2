const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Target = sequelize.define('Target', {
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
  target_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  period_days: {
    type: DataTypes.INTEGER
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Target;