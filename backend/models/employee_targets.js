// models/employee_targets.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeTarget = sequelize.define('EmployeeTarget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  target_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assigned_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  monthly_target: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  smart_invest_target: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  flex_saver_target: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Assigned', 'In Progress', 'Completed', 'Overdue'),
    defaultValue: 'Assigned',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'employee_targets',
  timestamps: false,
});

module.exports = EmployeeTarget;
