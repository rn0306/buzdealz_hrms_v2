const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Intern = sequelize.define('Intern', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  recruiter_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  manager_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Active',
    validate: {
      isIn: [['Active', 'Completed', 'Terminated', 'Extended']]
    }
  },
  remarks: {
    type: DataTypes.TEXT
  }
});

module.exports = Intern;