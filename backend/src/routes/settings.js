const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getPublic, getSignupSwitch } = require('../controllers/settingsController');

router.get('/', auth, getPublic);
router.get('/public', getSignupSwitch);

module.exports = router;
