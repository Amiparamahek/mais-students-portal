const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getClasses, getClassStudents, getClassAttendance } = require('../controllers/teachingController');

router.get('/classes', auth, adminOnly, getClasses);
router.get('/classes/:id/students', auth, adminOnly, getClassStudents);
router.get('/classes/:id/attendance', auth, adminOnly, getClassAttendance);

module.exports = router;
