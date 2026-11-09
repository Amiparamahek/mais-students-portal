const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const {
  getAll,
  getById,
  create,
  update,
  remove,
  enroll,
  unenroll,
  getMyEnrollments,
} = require('../controllers/courseController');

router.get('/', auth, getAll);

// Specific routes must come before '/:id' so they are not treated as an id.
router.post('/enroll', auth, enroll);
router.delete('/enroll/:courseId', auth, unenroll);
router.get('/my-enrollments', auth, getMyEnrollments);

router.get('/:id', auth, getById);
router.post('/', auth, adminOnly, create);
router.put('/:id', auth, adminOnly, update);
router.delete('/:id', auth, adminOnly, remove);

module.exports = router;
