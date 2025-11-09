const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Role = require('./Role');
// Candidate model removed; use User instead
const OfferLetter = require('./OfferLetter');
const Subscription = require('./Subscription');
const Target = require('./Target');
const Evaluation = require('./Evaluation');
const Extension = require('./Extension');
const Termination = require('./Termination');
const ActivityLog = require('./ActivityLog');
const PersonalDetail = require('./PersonalDetail');

// Define associations
// User & Role
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

// Candidates were removed; use User for candidate-related data. We keep recruiter->user relationships
// by using the User model's `recruiter_id` on User records. If needed, queries can filter users by role.


// Offer Letters now belong to User (candidate was mapped to a User)
OfferLetter.belongsTo(User, { foreignKey: 'candidate_id', as: 'candidate' });
OfferLetter.belongsTo(User, { foreignKey: 'issued_by', as: 'issuer' });
User.hasMany(OfferLetter, { foreignKey: 'candidate_id', as: 'offerLetters' });

// Subscription associations
Subscription.belongsTo(User, { foreignKey: 'user_id' });
Subscription.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });
User.hasMany(Subscription, { foreignKey: 'user_id' });

// Target associations
Target.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Target, { foreignKey: 'user_id' });

// Evaluation associations
Evaluation.belongsTo(User, { foreignKey: 'user_id' });
Evaluation.belongsTo(User, { foreignKey: 'evaluator_id', as: 'evaluator' });
User.hasMany(Evaluation, { foreignKey: 'user_id' });

// Extension associations
Extension.belongsTo(User, { foreignKey: 'user_id' });
Extension.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });
Extension.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
User.hasMany(Extension, { foreignKey: 'user_id' });

// Termination associations
Termination.belongsTo(User, { foreignKey: 'user_id' });
Termination.belongsTo(User, { foreignKey: 'terminated_by', as: 'terminator' });
User.hasOne(Termination, { foreignKey: 'user_id' });

// Activity Log associations
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ActivityLog, { foreignKey: 'user_id' });

// PersonalDetail associations (one-to-one with User)
PersonalDetail.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(PersonalDetail, { foreignKey: 'user_id', as: 'personalDetail' });


// Function to sync all models
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Role,
  OfferLetter,
  Subscription,
  Target,
  Evaluation,
  Extension,
  Termination,
  ActivityLog,
  PersonalDetail,
  syncDatabase
};