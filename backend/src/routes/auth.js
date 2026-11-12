const express = require('express');
const router = express.Router();
const { register, login, logout, me, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/logout', auth, logout);
router.post('/change-password', auth, changePassword);

module.exports = router;
