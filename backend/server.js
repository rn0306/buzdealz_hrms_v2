const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const personalDetailsRoutes = require('./routes/PersonalDetailsRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const internSubscriptionRoutes = require('./routes/internSubscriptionRoutes');

const targetsMasterRoutes = require('./routes/targetsMasterRoutes');
const employeeTargetsRoutes = require('./routes/employeeTargetsRoutes');

const app = express();

// ✅ CORS middleware
app.use(
  cors({
    origin: ['http://localhost:5173'], // your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ✅ JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Root route
app.get('/', (req, res) => res.json({ message: 'Buzdealz HRMS API' }));

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/personaldetails', personalDetailsRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/intern-subscriptions', internSubscriptionRoutes);

app.use('/api/targets-master', targetsMasterRoutes);
app.use('/api/employee-targets', employeeTargetsRoutes);

const PORT = process.env.PORT || 5000;

// ✅ Start server with model auto-update (non-destructive)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // 🧩 Auto update tables without dropping (safe for development)
    await sequelize.sync({ alter: true });
    console.log('🔄 Database schema synced (altered to match models)');

    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('❌ Unable to start server:', err);
    process.exit(1);
  }
})();

module.exports = app;
