const express = require('express');
const router = express.Router();
const { getProjectWiki, updateProjectWiki } = require('../controllers/wikiController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/project/:projectId', protect, getProjectWiki);
router.put('/project/:projectId', protect, updateProjectWiki);

module.exports = router;