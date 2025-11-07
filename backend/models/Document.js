const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  intern_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['Offer', 'Appointment', 'Certificate', 'Termination']]
    }
  },
  file_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  generated_by: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'generated_at',
  updatedAt: false
});

module.exports = Document;