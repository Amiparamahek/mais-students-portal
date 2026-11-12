const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getMyResults, exportCsv } = require('../controllers/reportController');
const { requireFeature } = require('../utils/features');

router.get('/my-results', auth, getMyResults);
router.get('/export/:kind', auth, adminOnly, requireFeature('analysis'), exportCsv);

module.exports = router;
