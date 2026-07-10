const express = require('express');
const router = express.Router();
const { getTeamMembers,inviteMember ,acceptInvitation} = require('../controllers/teamController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// GET request list layegi, aur POST request naya member add karegi
router.route('/')
  .get(protect, getTeamMembers)
  // .post(protect, authorizeRoles('Admin'),addTeamMember);

router.post('/invite', protect, authorizeRoles('Admin'), inviteMember);
router.post('/accept-invite', acceptInvitation);
module.exports = router;