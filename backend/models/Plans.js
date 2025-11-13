// models/Plans.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Plans = sequelize.define(
  "Plans",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    plan_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      defaultValue: "Active",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "plans",
    timestamps: false,
  }
);

module.exports = Plans;
