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
  // ID & Aadhaar / PAN
  aadhaar_number: {
    type: DataTypes.STRING(20)
  },
  pan_number: {
    type: DataTypes.STRING(20)
  },

  // Bank Details
  bank_name: {
    type: DataTypes.STRING(100)
  },
  bank_account_number: {
    type: DataTypes.STRING(50)
  },
  ifsc_code: {
    type: DataTypes.STRING(20)
  },

  // Education Details
  highest_qualification: {
    type: DataTypes.STRING(100)
  },
  university_board: {
    type: DataTypes.STRING(100)
  },
  passing_year: {
    type: DataTypes.STRING(10)
  },

  // Previous Experience
  company_name: {
    type: DataTypes.STRING(100)
  },
  role_designation: {
    type: DataTypes.STRING(100)
  },
  duration: {
    type: DataTypes.STRING(50)
  },

  // Other Documents
  id_proof_url: {
    type: DataTypes.TEXT
  },
  other_documents_url: {
    type: DataTypes.TEXT
  },

  // Status
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
