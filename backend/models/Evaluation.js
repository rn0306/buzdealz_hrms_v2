const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evaluation = sequelize.define('Evaluation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  intern_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  evaluator_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  performance_score: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  remarks: {
    type: DataTypes.TEXT
  },
  evaluation_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  evaluation_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'Final',
    validate: {
      isIn: [['Midterm', 'Final']]
    }
  }
});

module.exports = Evaluation;