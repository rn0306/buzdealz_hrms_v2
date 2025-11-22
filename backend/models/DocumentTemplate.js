const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 


  const DocumentTemplate = sequelize.define('DocumentTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: true },
    body_html: { type: DataTypes.TEXT('long'), allowNull: true },
    placeholders: { type: DataTypes.JSON, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'document_templates',
    timestamps: true,
  });

  
  
module.exports = DocumentTemplate;