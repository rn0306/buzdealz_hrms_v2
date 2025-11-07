const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OnboardingDetail = sequelize.define('OnboardingDetail', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidate_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_proof_url: {
    type: DataTypes.TEXT
  },
  bank_account_number: {
    type: DataTypes.STRING(50)
  },
  ifsc_code: {
    type: DataTypes.STRING(20)
  },
  pan_number: {
    type: DataTypes.STRING(20)
  },
  aadhaar_number: {
    type: DataTypes.STRING(20)
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Pending',
    validate: {
      isIn: [['Pending', 'Verified', 'Rejected']]
    }
  },
  verified_by: {
    type: DataTypes.UUID
  },
  verified_at: {
    type: DataTypes.DATE
  }
});

module.exports = OnboardingDetail;