const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');

require('dotenv').config();

const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const personalDetailsRoutes = require('./routes/PersonalDetailsRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const roleRoutes = require('./routes/roleRoutes');
const extensionRoutes = require('./routes/extensionRoutes');
const terminationRoutes = require('./routes/terminationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const internSubscriptionRoutes = require('./routes/internSubscriptionRoutes');
const plansRoutes = require('./routes/plansRoutes');
const targetsMasterRoutes = require('./routes/targetsMasterRoutes');
const employeeTargetsRoutes = require('./routes/employeeTargetsRoutes');
const documentRoutes = require('./routes/documentRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

const app = express();
const server = http.createServer(app);

// ✅ CORS middleware
app.use(
  cors({
    origin: ['http://localhost:5173'], // your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ✅ Socket.IO setup
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance on app for access in controllers
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join user-specific room on connection
  socket.on('user:auth', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room user_${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`❌ Socket error: ${error}`);
  });
});

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
app.use('/api/roles', roleRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/terminations', terminationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/intern-subscriptions', internSubscriptionRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/targets-master', targetsMasterRoutes);
app.use('/api/employee-targets', employeeTargetsRoutes);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', documentRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationsRoutes);

const PORT = process.env.PORT || 5000;

// ✅ Start server with model auto-update (non-destructive)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // 🧩 Auto update tables without dropping (safe for development)
    await sequelize.sync({ alter: true });
    console.log('🔄 Database schema synced (altered to match models)');

    server.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('❌ Unable to start server:', err);
    process.exit(1);
  }
})();

module.exports = app;
