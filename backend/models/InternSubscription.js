// models/InternSubscription.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InternSubscription = sequelize.define('InternSubscription', {
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
  subscription_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  subscriber_email: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  subscriber_phone: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  subscription_plan: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  submission_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  proof_file_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  validation_status: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'DUPLICATE', 'INVALID', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  validation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verified_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'intern_subscriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// // ✅ Relationships
// InternSubscription.belongsTo(Subscription, {
//   foreignKey: 'subscription_id',
//   targetKey: 'subscription_id',
//   as: 'subscription_info'
// });

module.exports = InternSubscription;
