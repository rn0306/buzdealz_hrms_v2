const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'user_id',
    },

    manager_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id',
      },
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'email',
      validate: {
        isEmail: true,
      },
    },

    recruiter_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    fname: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    mname: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    lname: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    joining_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    confirmation_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    date_of_departure: {
      type: DataTypes.DATEONLY,
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
    tableName: 'Users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },
    },
  }
);

User.associate = (models) => {
  User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'Role' });
  if (models.PersonalDetail) {
    User.hasOne(models.PersonalDetail, { foreignKey: 'user_id', as: 'personalDetail' });
  }
};

User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash);
};

module.exports = User;
