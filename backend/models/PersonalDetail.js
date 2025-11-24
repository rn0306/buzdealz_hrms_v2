const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PersonalDetail = sequelize.define(
  'PersonalDetail',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'user_id',
      },
    },

    adhar_card_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    pan_card_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    bank_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    account_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    branch_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    ifsc_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    highest_education: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    university_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    passing_year: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    last_company_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    role_designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    duration: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    other_documents_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    id_proof_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    resume_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    work_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    internship_duration_months: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    internship_duration_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    stipend: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    verification_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // URLs for generated letters
    offer_letter_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    experience_letter_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    joining_letter_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    confirmation_letter_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    verified_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: 'PersonalDetails',
    timestamps: true,
    underscored: true,
  }
);

PersonalDetail.associate = (models) => {
  PersonalDetail.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
};

module.exports = PersonalDetail;
