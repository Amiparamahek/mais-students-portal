const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getMyGrades, create } = require('../controllers/gradeController');

router.get('/my-grades', auth, getMyGrades);
router.post('/', auth, adminOnly, create);

module.exports = router;
