const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OfferLetter = sequelize.define('OfferLetter', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidate_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  offer_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  issued_by: {
    type: DataTypes.UUID,
    allowNull: false
  },
  accepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  accepted_at: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  createdAt: 'issued_at',
  updatedAt: false
});

module.exports = OfferLetter;