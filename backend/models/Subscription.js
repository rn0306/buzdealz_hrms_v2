const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
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
  subscriber_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  subscription_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(150)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  verification_status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Pending',
    validate: {
      isIn: [['Pending', 'Verified', 'Invalid', 'Completed']]
    }
  },
  verified_by: {
    type: DataTypes.UUID
  },
  verified_at: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Subscription;