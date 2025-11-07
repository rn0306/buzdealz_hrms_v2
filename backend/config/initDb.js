const { sequelize, Role, syncDatabase } = require('./models');

const initializeDatabase = async () => {
  try {
    // Sync all models
    await syncDatabase(true); // Set to false in production

    // Create default roles
    const roles = [
      {
        code: 'ADMIN',
        name: 'Administrator',
        description: 'Full system access with all permissions'
      },
      {
        code: 'RECRUITER',
        name: 'Recruiter/HR',
        description: 'Manages hiring, onboarding, and document verification'
      },
      {
        code: 'MANAGER',
        name: 'Manager/Supervisor',
        description: 'Monitors intern performance and approves extensions'
      },
      {
        code: 'INTERN',
        name: 'Intern',
        description: 'Performs assigned tasks and tracks progress'
      },
      {
        code: 'VERIFIER',
        name: 'Verifier',
        description: 'Handles subscription and database validation'
      }
    ];

    await Role.bulkCreate(roles);
    console.log('Database initialized successfully with default roles');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Run initialization if this file is run directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;