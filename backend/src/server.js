require('dotenv').config();

// Stop early with a clear message if the configuration is unsafe (e.g. a published secret).
const { loadConfig } = require('./utils/config');
let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const express = require('express');
const path = require('path');

const db = require('./config/database');
const { applySecurity, limits } = require('./middleware/security');
const settings = require('./utils/settings');
settings.set(config);
const auditAdminWrites = require('./middleware/audit');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const gradeRoutes = require('./routes/grades');
const attendanceRoutes = require('./routes/attendance');
const timetableRoutes = require('./routes/timetable');
const examRoutes = require('./routes/exams');
const announcementRoutes = require('./routes/announcements');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const teachingRoutes = require('./routes/teaching');
const securityRoutes = require('./routes/security');

const app = express();
const PORT = process.env.PORT || 5001;

applySecurity(app, config);
app.use(express.json({ limit: '100kb' }));

// Rate limits. Specific routes first, then everything under /api.
app.use('/api/auth/login', limits.login);
app.use('/api/auth/register', limits.register);
app.use('/api/attendance/check-in', limits.checkIn);
app.use('/api', limits.api);
app.use(auditAdminWrites);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MAIS Student Portal API running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teaching', teachingRoutes);
app.use('/api/admin/security', securityRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  // Errors with a status (e.g. malformed JSON from body-parser) keep it; everything else is a 500.
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: 'Bad request' });
  }
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
