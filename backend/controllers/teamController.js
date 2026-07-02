const User = require('../models/User');

// @desc    Get all team members in the user's organization
// @route   GET /api/v1/team
exports.getTeamMembers = async (req, res) => {
  try {
    const team = await User.find({ organizationId: req.user.organizationId }).select('-password');
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new member to the organization
// @route   POST /api/v1/team
exports.addTeamMember = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check karein ke is email se koi pehle se toh nahi bana hua
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 2. Naya user create karein (Admin ki organizationId ke sath)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Member', // Default role 'Member' hoga
      organizationId: req.user.organizationId,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};