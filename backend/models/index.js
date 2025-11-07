const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Role = require('./Role');
const Candidate = require('./Candidate');
const OnboardingDetail = require('./OnboardingDetail');
const OfferLetter = require('./OfferLetter');
const Intern = require('./Intern');
const Subscription = require('./Subscription');
const Target = require('./Target');
const DailyLog = require('./DailyLog');
const Evaluation = require('./Evaluation');
const Extension = require('./Extension');
const Termination = require('./Termination');
const Document = require('./Document');
const ActivityLog = require('./ActivityLog');
const ApiLog = require('./ApiLog');

// Define associations
// User & Role
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

// Candidate & User (Recruiter)
Candidate.belongsTo(User, { foreignKey: 'assigned_recruiter', as: 'recruiter' });
User.hasMany(Candidate, { foreignKey: 'assigned_recruiter', as: 'assignedCandidates' });

// Onboarding Details & Candidate
OnboardingDetail.belongsTo(Candidate, { foreignKey: 'candidate_id' });
Candidate.hasOne(OnboardingDetail, { foreignKey: 'candidate_id' });

// Offer Letters
OfferLetter.belongsTo(Candidate, { foreignKey: 'candidate_id' });
OfferLetter.belongsTo(User, { foreignKey: 'issued_by', as: 'issuer' });
Candidate.hasMany(OfferLetter, { foreignKey: 'candidate_id' });

// Intern associations
Intern.belongsTo(User, { foreignKey: 'user_id' });
Intern.belongsTo(User, { foreignKey: 'recruiter_id', as: 'recruiter' });
Intern.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

// Subscription associations
Subscription.belongsTo(Intern, { foreignKey: 'intern_id' });
Subscription.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });
Intern.hasMany(Subscription, { foreignKey: 'intern_id' });

// Target associations
Target.belongsTo(Intern, { foreignKey: 'intern_id' });
Intern.hasMany(Target, { foreignKey: 'intern_id' });

// Daily Log associations
DailyLog.belongsTo(Intern, { foreignKey: 'intern_id' });
Intern.hasMany(DailyLog, { foreignKey: 'intern_id' });

// Evaluation associations
Evaluation.belongsTo(Intern, { foreignKey: 'intern_id' });
Evaluation.belongsTo(User, { foreignKey: 'evaluator_id', as: 'evaluator' });
Intern.hasMany(Evaluation, { foreignKey: 'intern_id' });

// Extension associations
Extension.belongsTo(Intern, { foreignKey: 'intern_id' });
Extension.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });
Extension.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
Intern.hasMany(Extension, { foreignKey: 'intern_id' });

// Termination associations
Termination.belongsTo(Intern, { foreignKey: 'intern_id' });
Termination.belongsTo(User, { foreignKey: 'terminated_by', as: 'terminator' });
Intern.hasOne(Termination, { foreignKey: 'intern_id' });

// Document associations
Document.belongsTo(Intern, { foreignKey: 'intern_id' });
Document.belongsTo(User, { foreignKey: 'generated_by', as: 'generator' });
Intern.hasMany(Document, { foreignKey: 'intern_id' });

// Activity Log associations
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ActivityLog, { foreignKey: 'user_id' });

// API Log associations
ApiLog.belongsTo(Intern, { foreignKey: 'intern_id' });
ApiLog.belongsTo(Subscription, { foreignKey: 'subscription_id' });
Intern.hasMany(ApiLog, { foreignKey: 'intern_id' });
Subscription.hasMany(ApiLog, { foreignKey: 'subscription_id' });

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
  Candidate,
  OnboardingDetail,
  OfferLetter,
  Intern,
  Subscription,
  Target,
  DailyLog,
  Evaluation,
  Extension,
  Termination,
  Document,
  ActivityLog,
  ApiLog,
  syncDatabase
};