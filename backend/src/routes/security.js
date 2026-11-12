const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { summary, events, review, audit } = require('../controllers/securityController');
const { requireFeature } = require('../utils/features');

router.use(requireFeature('security'));

router.get('/summary', auth, adminOnly, summary);
router.get('/events', auth, adminOnly, events);
router.post('/events/:id/review', auth, adminOnly, review);
router.get('/audit', auth, adminOnly, audit);

module.exports = router;
