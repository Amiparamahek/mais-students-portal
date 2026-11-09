const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getMyAttendance, createOrUpdate } = require('../controllers/attendanceController');

router.get('/my-attendance', auth, getMyAttendance);
router.post('/', auth, adminOnly, createOrUpdate);

module.exports = router;
