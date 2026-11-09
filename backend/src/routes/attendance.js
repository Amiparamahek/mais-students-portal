const express = require('express');
const router = express.Router();
const { auth, staffOnly } = require('../middleware/auth');
const { getMyAttendance, createOrUpdate } = require('../controllers/attendanceController');

router.get('/my-attendance', auth, getMyAttendance);
router.post('/', auth, staffOnly, createOrUpdate);

module.exports = router;
