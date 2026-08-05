const express = require('express');
const router = express.Router();
const { getAutomations, createAutomation, deleteAutomation } = require('../controllers/automationController');
const { protect } = require('../middlewares/authMiddleware'); // Use your existing auth middleware

router.route('/')
  .get(protect, getAutomations)
  .post(protect, createAutomation);

router.route('/:id')
  .delete(protect, deleteAutomation);

module.exports = router;