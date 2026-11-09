const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getAll, create, remove } = require('../controllers/documentController');

router.get('/', auth, getAll);
router.post('/', auth, adminOnly, create);
router.delete('/:id', auth, adminOnly, remove);

module.exports = router;
