const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getAll, create } = require('../controllers/examController');

router.get('/', auth, getAll);
router.post('/', auth, adminOnly, create);

module.exports = router;
