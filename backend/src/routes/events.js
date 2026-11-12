const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { stream } = require('../controllers/eventsController');

router.get('/', auth, stream);

module.exports = router;
