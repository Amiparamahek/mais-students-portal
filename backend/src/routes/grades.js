const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getMyGrades, create, getAll, remove } = require('../controllers/gradeController');

router.get('/my-grades', auth, getMyGrades);
router.get('/', auth, adminOnly, getAll);
router.post('/', auth, adminOnly, create);
router.delete('/:id', auth, adminOnly, remove);

module.exports = router;
