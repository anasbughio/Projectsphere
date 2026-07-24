const express = require('express');
const router = express.Router();
const { createAnnouncement, getActiveAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, isSuperAdmin } = require('../middlewares/authMiddleware');

router.get('/', protect, getActiveAnnouncements);
router.post('/', protect, isSuperAdmin, createAnnouncement);
router.delete('/:id', protect, isSuperAdmin, deleteAnnouncement);

module.exports = router;