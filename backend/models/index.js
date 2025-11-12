// models/index.js
const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Role = require('./Role');
const OfferLetter = require('./OfferLetter');
const subscription = require('./Subscription');
const Target = require('./Target');
const Evaluation = require('./Evaluation');
const Extension = require('./Extension');
const Termination = require('./Termination');
const ActivityLog = require('./ActivityLog');
const PersonalDetail = require('./PersonalDetail');
const InternSubscription = require('./InternSubscription');
const TargetsMaster = require('./targets_master'); // ✅ proper model init
const EmployeeTarget = require('./employee_targets');
const EmployeeTargetProgress = require('./employee_target_progress');

// ======================
// 🔗 Define Associations
// ======================

// 🧍 User & Role
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

// 💼 Offer Letters
OfferLetter.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
OfferLetter.belongsTo(User, { foreignKey: 'issued_by', as: 'issuer' });
User.hasMany(OfferLetter, { foreignKey: 'user_id', as: 'offerLetters' });

// 🎯 Target (old target table)
Target.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Target, { foreignKey: 'user_id' });

// 🧾 Evaluations
Evaluation.belongsTo(User, { foreignKey: 'user_id' });
Evaluation.belongsTo(User, { foreignKey: 'evaluator_id', as: 'evaluator' });
User.hasMany(Evaluation, { foreignKey: 'user_id' });

// ⏳ Extensions
Extension.belongsTo(User, { foreignKey: 'user_id' });
Extension.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });
Extension.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
User.hasMany(Extension, { foreignKey: 'user_id' });

// ❌ Terminations
Termination.belongsTo(User, { foreignKey: 'user_id' });
Termination.belongsTo(User, { foreignKey: 'terminated_by', as: 'terminator' });
User.hasOne(Termination, { foreignKey: 'user_id' });

// 🧾 Activity Logs
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ActivityLog, { foreignKey: 'user_id' });

// 👤 Personal Details
PersonalDetail.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(PersonalDetail, { foreignKey: 'user_id', as: 'personalDetail' });

// ==========================================
// 🎯 New Targeting Module Associations
// ==========================================

// 🔹 1. EmployeeTarget ↔ User (who gets the target)
EmployeeTarget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(EmployeeTarget, { foreignKey: 'user_id', as: 'employeeTargets' });

// 🔹 2. EmployeeTarget ↔ TargetsMaster (target definition)
EmployeeTarget.belongsTo(TargetsMaster, { foreignKey: 'target_id', as: 'target' });
TargetsMaster.hasMany(EmployeeTarget, { foreignKey: 'target_id', as: 'assignedTargets' });

// 🔹 3. EmployeeTarget ↔ EmployeeTargetProgress (progress logs)
EmployeeTarget.hasMany(EmployeeTargetProgress, { foreignKey: 'employee_target_id', as: 'progressRecords' });
EmployeeTargetProgress.belongsTo(EmployeeTarget, { foreignKey: 'employee_target_id', as: 'employeeTarget' });

// 🔹 4. (Optional) EmployeeTarget.assigned_by → User (manager who assigned it)
EmployeeTarget.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });
User.hasMany(EmployeeTarget, { foreignKey: 'assigned_by', as: 'assignedTargets' });

// ==========================================

// 🧩 Function to sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synced successfully');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Role,
  OfferLetter,
  subscription,
  Target,
  Evaluation,
  Extension,
  Termination,
  ActivityLog,
  PersonalDetail,
  TargetsMaster,
  EmployeeTarget,
  EmployeeTargetProgress,
  InternSubscription,
  syncDatabase
};
