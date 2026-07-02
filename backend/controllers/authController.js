const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');

// @desc    Register new organization & admin user
// @route   POST /api/v1/auth/register
// @access  Public
exports.registerOrg = async (req, res) => {
  try {
    const { orgName, userName, email, password } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Create the Organization first
    const organization = await Organization.create({
      name: orgName,
    });

    // 3. Create the Admin User linked to this Organization
    const user = await User.create({
      name: userName,
      email,
      password,
      role: 'Admin',
      organizationId: organization._id,
    });

    // 4. Generate JWT Token
    const token = generateToken(user._id, organization._id, user.role);

    res.status(201).json({
      message: 'Organization and Admin registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: organization._id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email check karein (kyunke password select: false tha model mein, isliye yahan .select('+password') use kiya hai)
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id, user.organizationId, user.role);
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};