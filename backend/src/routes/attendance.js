const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getMyAttendance, getMyLog, createOrUpdate } = require('../controllers/attendanceController');
const { getToday, postCheckIn } = require('../controllers/checkinController');
const { requireFeature } = require('../utils/features');

router.get('/my-attendance', auth, getMyAttendance);
router.get('/my-log', auth, getMyLog);
router.get('/today', auth, getToday);
router.post('/check-in', auth, requireFeature('checkin'), postCheckIn);
router.post('/', auth, adminOnly, createOrUpdate);

module.exports = router;
