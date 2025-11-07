const { sequelize, Role, syncDatabase } = require('./models');

const setupDatabase = async () => {
  try {
    // Force sync all models (this will drop existing tables)
    console.log('Syncing database...');
    await syncDatabase(true);

    console.log('Creating default roles...');
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
    console.log('Default roles created successfully');

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

setupDatabase();