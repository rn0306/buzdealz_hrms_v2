// models/targets_master.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TargetsMaster = sequelize.define(
  "TargetsMaster",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    target_description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // 🔥 DYNAMIC PLANS MAPPING HERE
    // Stores: { plan_id: count }
    plans: {
      type: DataTypes.JSON, // use JSONB for Postgres
      allowNull: false,
      defaultValue: {},
    },

    deadline_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    created_by: {
      type: DataTypes.UUID,
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
    tableName: "targets_master",
    timestamps: false,
  }
);

TargetsMaster.associate = (models) => {
  TargetsMaster.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "creator",
  });

  TargetsMaster.hasMany(models.EmployeeTarget, {
    foreignKey: "target_id",
    as: "assigned_targets",
  });
};

module.exports = TargetsMaster;
