const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const EmailTemplate = require('./EmailTemplate');

const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  template_id: {
    type: DataTypes.UUID,
    references: {
      model: EmailTemplate,
      key: 'id'
    }
  },
  recipient_email: DataTypes.STRING(150),
  recipient_name: DataTypes.STRING(150),
  subject_rendered: DataTypes.STRING(255),
  body_rendered: DataTypes.TEXT,
  data_used: DataTypes.JSON,
  status: {
    type: DataTypes.ENUM('SENT', 'FAILED', 'QUEUED'),
    defaultValue: 'QUEUED'
  },
  error_message: DataTypes.TEXT,
  sent_at: DataTypes.DATE
}, {
  timestamps: false,
  tableName: 'email_logs'
});

module.exports = EmailLog;
