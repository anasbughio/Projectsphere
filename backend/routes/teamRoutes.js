const express = require('express');
const router = express.Router();
const { getTeamMembers, addTeamMember } = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');

// GET request list layegi, aur POST request naya member add karegi
router.route('/')
  .get(protect, getTeamMembers)
  .post(protect, addTeamMember);

module.exports = router;