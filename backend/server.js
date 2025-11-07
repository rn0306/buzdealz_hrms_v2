const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

const app = express();

// ✅ CORS middleware (safe for Node 22+)
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

const PORT = process.env.PORT || 5000;

// ✅ Start server
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Unable to start server:', err);
    process.exit(1);
  }
})();

module.exports = app;
