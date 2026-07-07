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

    // 6-digit random verification code banayen
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const organization = await Organization.create({ name: orgName });

    const user = await User.create({
      name: userName, 
      email, 
      password, 
      role: 'Admin', 
      organizationId: organization._id,
      verificationCode // OTP save kar liya
    });

    // Email Send Karein
    const emailHtml = `
      <h2>Welcome to ProjectSphere!</h2>
      <p>Your email verification code is: <strong>${verificationCode}</strong></p>
      <p>Please enter this code in the app to complete your registration.</p>
    `;

    try {
      await sendEmail({ email: user.email, subject: 'ProjectSphere - Verify Your Email', html: emailHtml });
    } catch (error) {
      // Agar email send fail ho jaye
      await User.findByIdAndDelete(user._id);
      await Organization.findByIdAndDelete(organization._id);
      return res.status(500).json({ message: 'Error sending verification email. Try again.' });
    }

    // Yahan tokens NAHI bhejenge, sirf success message denge
    res.status(200).json({
      message: 'Verification code sent to your email',
      email: user.email // Frontend isay use karega OTP screen par
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Code match ho gaya! Ab user ko verify kar dein
    user.isEmailVerified = true;
    user.verificationCode = undefined; // OTP clear kar dein taake dobara use na ho
    
    // Ab user ko dual-tokens issue karein (Login process complete)
    const { accessToken, refreshToken } = generateToken(user._id, user.organizationId, user.role);
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('jwt_refresh', refreshToken, cookieOptions);

    res.json({
      message: 'Email verified and logged in successfully',
      token: accessToken,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId },
    });

  } catch (error) { res.status(500).json({ message: "Internal Server Error" }); }
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