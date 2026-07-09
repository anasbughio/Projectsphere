const express = require('express');
const router = express.Router();
const { addComment, getComments } = require('../controllers/collaboratiobController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/:taskId/comments')
  .post(protect, addComment)
  .get(protect, getComments);

module.exports = router;