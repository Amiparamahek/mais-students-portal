const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getByUser, getUnreadCount, create, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/', auth, getByUser);
router.get('/unread-count', auth, getUnreadCount);
router.post('/', auth, create);
router.put('/:id/read', auth, markAsRead);
router.put('/mark-all-read', auth, markAllAsRead);

module.exports = router;
