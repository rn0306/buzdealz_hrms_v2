// models/employee_target_progress.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeTargetProgress = sequelize.define('EmployeeTargetProgress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employee_target_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  monthly_achieved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  smart_invest_achieved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  flex_saver_achieved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  progress_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'employee_target_progress',
  timestamps: false,
});

module.exports = EmployeeTargetProgress;
