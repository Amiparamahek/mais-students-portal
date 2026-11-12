const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');

const adminController = require('../controllers/adminController');
const courseController = require('../controllers/courseController');
const timetableController = require('../controllers/timetableController');
const attendanceController = require('../controllers/attendanceController');
const analyticsController = require('../controllers/analyticsController');

// Dashboard stats
router.get('/dashboard-stats', auth, adminOnly, adminController.getDashboardStats);
router.get('/analysis', auth, adminOnly, analyticsController.getOverview);

// Student management
router.get('/students', auth, adminOnly, adminController.getStudents);
router.get('/students/:id/profile', auth, adminOnly, analyticsController.getStudentProfile);
router.get('/students/:id', auth, adminOnly, adminController.getStudent);
router.post('/students', auth, adminOnly, adminController.createStudent);
router.put('/students/:id', auth, adminOnly, adminController.updateStudent);
router.delete('/students/:id', auth, adminOnly, adminController.deleteStudent);
router.post('/students/:id/reset-password', auth, adminOnly, adminController.resetStudentPassword);
router.put('/students/:id/toggle-active', auth, adminOnly, adminController.toggleStudentActive);
router.get('/students/:id/courses', auth, adminOnly, adminController.getStudentCourses);

// Course management
router.get('/courses', auth, adminOnly, adminController.getCourses);
router.post('/courses', auth, adminOnly, courseController.create);
router.put('/courses/:id', auth, adminOnly, courseController.update);
router.delete('/courses/:id', auth, adminOnly, courseController.remove);
router.get('/courses/:id/students', auth, adminOnly, adminController.getCourseStudents);

// Attendance
router.post('/attendance', auth, adminOnly, attendanceController.createOrUpdate);
router.get('/attendance/report', auth, adminOnly, adminController.getAttendanceReport);

// Timetable management
router.get('/timetable', auth, adminOnly, timetableController.getAll);
router.post('/timetable', auth, adminOnly, timetableController.create);
router.put('/timetable/:id', auth, adminOnly, timetableController.update);
router.get('/timetable/conflicts', auth, adminOnly, timetableController.conflicts);
router.delete('/timetable/:id', auth, adminOnly, timetableController.remove);

// Announcements
router.post('/announcements', auth, adminOnly, adminController.createAnnouncement);

// Accounts / records
router.get('/accounts', auth, adminOnly, adminController.getAccounts);
router.get('/records', auth, adminOnly, adminController.getRecords);

module.exports = router;
