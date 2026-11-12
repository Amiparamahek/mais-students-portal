const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { requireFeature } = require('../utils/features');
const { categories, create, list, thread, addMessage, setStatus, summary } = require('../controllers/requestController');

router.use(auth, requireFeature('chat'));

router.get('/categories', categories);
router.get('/summary', adminOnly, summary);
router.get('/', list);
router.post('/', create);
router.get('/:id', thread);
router.post('/:id/messages', addMessage);
router.post('/:id/status', adminOnly, setStatus);

module.exports = router;
