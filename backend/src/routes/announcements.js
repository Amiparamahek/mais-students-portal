const express = require('express');
const router = express.Router();
const { auth, adminOnly, staffOnly } = require('../middleware/auth');
const { getAll, create, update, remove } = require('../controllers/announcementController');

router.get('/', auth, getAll);
router.post('/', auth, staffOnly, create);
router.put('/:id', auth, adminOnly, update);
router.delete('/:id', auth, adminOnly, remove);

module.exports = router;
