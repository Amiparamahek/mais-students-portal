const express = require('express');
const router = express.Router();
const { auth, staffOnly } = require('../middleware/auth');
const { getMyCourses, getCourseStudents, getCourseAttendance } = require('../controllers/lecturerController');

router.get('/courses', auth, staffOnly, getMyCourses);
router.get('/courses/:id/students', auth, staffOnly, getCourseStudents);
router.get('/courses/:id/attendance', auth, staffOnly, getCourseAttendance);

module.exports = router;
