const express = require('express');
const router = express.Router();
const { inviteMember, acceptInvitation, getPendingInvitations } = require('../controllers/teamController');
const { getTeamMembers, deleteMember } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// GET request list , and POST request add new member
router.route('/')
  .get(protect, getTeamMembers);

router.post('/invite', protect, authorizeRoles('Admin'), inviteMember);
router.post('/accept-invite', acceptInvitation);
router.get('/members', protect, getTeamMembers);
router.get('/invitations', protect, getPendingInvitations);
router.delete('/:id', protect, authorizeRoles('Super Admin', 'Org Admin', 'Admin'), deleteMember);
module.exports = router;