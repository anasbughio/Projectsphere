const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');
const jwt = require('jsonwebtoken');

const cookieOptions = {
  httpOnly: true,
  secure: true, // Render par HTTPS hota hai isliye ye true hona chahiye
  sameSite: 'none', // Different domains (Vercel -> Render) ke liye lazmi hai
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

exports.registerOrg = async (req, res) => {
  try {
    const { orgName, userName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const organization = await Organization.create({ name: orgName });

    const user = await User.create({
      name: userName, email, password, role: 'Admin', organizationId: organization._id,
    });

    // Dono tokens generate karein
    const { accessToken, refreshToken } = generateToken(user._id, organization._id, user.role);
    
    // Refresh token DB mein save karein
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Cookie set karein
    res.cookie('jwt_refresh', refreshToken, cookieOptions);

    res.status(201).json({
      message: 'Organization and Admin registered successfully',
      token: accessToken, // 15-min token
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, organizationId: organization._id },
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const { accessToken, refreshToken } = generateToken(user._id, user.organizationId, user.role);
      
      // Refresh token DB mein save karein
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      // Cookie set karein
      res.cookie('jwt_refresh', refreshToken, cookieOptions);

      res.json({
        message: 'Login successful',
        token: accessToken, // 15-min token
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId },
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) { res.status(500).json({ message: "Internal Server Error", errorDetails: error.message }); }
};


exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.jwt_refresh; // Cookie se token uthayen
    if (!token) return res.status(403).json({ message: 'Access Denied, no refresh token' });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // Check agar user delete ho gaya ho ya token DB match na kare (Revocation check)
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Access Denied, token invalid or revoked' });
    }

    // Naya access token banayein
    const { accessToken } = generateToken(user._id, user.organizationId, user.role);

    res.json({ token: accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid Refresh Token' });
  }
};

// 👉 NAYA: Logout Controller (Revocation)
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.jwt_refresh;
    if (token) {
      // Decode and remove token from DB
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
    }
  } catch (error) {
    // Ignore error if token is already expired
  }

  // Cookie clear karein
  res.clearCookie('jwt_refresh', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ message: 'Logged out successfully' });
};