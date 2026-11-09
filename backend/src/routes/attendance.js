const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getMyAttendance, getMyLog, createOrUpdate } = require('../controllers/attendanceController');

router.get('/my-attendance', auth, getMyAttendance);
router.get('/my-log', auth, getMyLog);
router.post('/', auth, adminOnly, createOrUpdate);

module.exports = router;
