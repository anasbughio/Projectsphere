const express = require('express');
const router = express.Router();
const { addComment, getComments ,getNotifications, markNotificationsAsRead} = require('../controllers/collaboratiobController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/:taskId/comments')
  .post(protect, addComment)
  .get(protect, getComments);

  router.get('/notifications', protect, getNotifications);
router.put('/notifications/mark-read', protect, markNotificationsAsRead);
module.exports = router;