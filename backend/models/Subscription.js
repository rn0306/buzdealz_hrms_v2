// models/Subscription.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // ✅ you missed this line earlier

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subscription_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  subscriber_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  subscription_plan: {
    type: DataTypes.ENUM('Monthly Plan', 'Smart Invest Plan', 'Flex Saver Plan'),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  verification_status: {
    type: DataTypes.ENUM('Pending', 'Verified', 'Invalid', 'Completed'),
    defaultValue: 'Pending',
  },
  verified_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'subscriptions', // ✅ lowercase to match your FK
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Subscription;
