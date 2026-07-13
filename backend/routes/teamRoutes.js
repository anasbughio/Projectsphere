const express = require('express');
const router = express.Router();
const { getTeamMembers,inviteMember ,acceptInvitation,deleteMember} = require('../controllers/teamController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// GET request list layegi, aur POST request naya member add karegi
router.route('/')
  .get(protect, getTeamMembers)

router.post('/invite', protect, authorizeRoles('Admin'), inviteMember);
router.post('/accept-invite', acceptInvitation);
router.delete('/:id', protect, authorizeRoles('Admin', 'Org Admin'), deleteMember);
module.exports = router;