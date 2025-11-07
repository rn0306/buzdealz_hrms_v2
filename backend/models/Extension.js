const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Extension = sequelize.define('Extension', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  intern_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  requested_by: {
    type: DataTypes.UUID,
    allowNull: false
  },
  approved_by: {
    type: DataTypes.UUID
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  old_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  new_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Pending',
    validate: {
      isIn: [['Pending', 'Approved', 'Rejected']]
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Extension;