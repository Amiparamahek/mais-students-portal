const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getAccounts, getCourses, getRecords, createAnnouncement } = require('../controllers/adminController');

router.get('/accounts', auth, adminOnly, getAccounts);
router.get('/courses', auth, adminOnly, getCourses);
router.get('/records', auth, adminOnly, getRecords);
router.post('/announcements', auth, adminOnly, createAnnouncement);

module.exports = router;
