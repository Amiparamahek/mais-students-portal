const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const {
  getAccounts,
  getCourses,
  getRecords,
  createAnnouncement,
  updateStudent,
  deleteStudent,
  toggleStudentActive,
  getCourseStudents,
  getAttendanceReport,
} = require('../controllers/adminController');

router.get('/accounts', auth, adminOnly, getAccounts);
router.get('/courses', auth, adminOnly, getCourses);
router.get('/records', auth, adminOnly, getRecords);
router.post('/announcements', auth, adminOnly, createAnnouncement);

// Student management
router.put('/students/:id', auth, adminOnly, updateStudent);
router.delete('/students/:id', auth, adminOnly, deleteStudent);
router.put('/students/:id/toggle-active', auth, adminOnly, toggleStudentActive);

// Course students
router.get('/courses/:id/students', auth, adminOnly, getCourseStudents);

// Attendance report
router.get('/attendance/report', auth, adminOnly, getAttendanceReport);

module.exports = router;
