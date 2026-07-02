const User = require('../models/User');

// @desc    Get all team members in the user's organization
// @route   GET /api/v1/team
exports.getTeamMembers = async (req, res) => {
  try {
    // Password hide karke sirf naam, email aur role bhej rahe hain
    const team = await User.find({ organizationId: req.user.organizationId }).select('-password');
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};