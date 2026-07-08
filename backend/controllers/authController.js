const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const Otp = require('../models/Otp');

const cookieOptions = {
  httpOnly: true,
  secure: true, // Render par HTTPS hota hai isliye ye true hona chahiye
  sameSite: 'none', // Different domains (Vercel -> Render) ke liye lazmi hai
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// 1. REGISTER ORG (Sirf OTP aur Temporary Data Save Karega)
exports.registerOrg = async (req, res) => {
  try {
    const { orgName, userName, email, password } = req.body;

    // Check karein ke kahin asal DB mein user pehle se toh nahi
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists and is verified' });

    // 6-digit random verification code banayen
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Email Send Karein
    const emailHtml = `
      <h2>Welcome to ProjectSphere!</h2>
      <p>Your email verification code is: <strong>${verificationCode}</strong></p>
      <p>This code will expire in 10 minutes. Please enter it in the app to complete your registration.</p>
    `;

    try {
      console.log("---> ⏳ Sending Email first...");
      await sendEmail({ email, subject: 'ProjectSphere - Verify Your Email', html: emailHtml });
      
      // Email successful hone ke baad, Purana koi OTP ho toh delete karein
      await Otp.findOneAndDelete({ email });
      
      // Ab Data ko sirf Temporary OTP collection mein dalen (Asal DB mein nahi)
      await Otp.create({
        email,
        otp: verificationCode,
        userData: { orgName, userName, password }
      });
      console.log("---> ✅ Email sent and Temporary OTP saved");

      return res.status(200).json({
        message: 'Verification code sent to your email',
        email: email 
      });

    } catch (error) {
      console.error("Email Error:", error.message);
      return res.status(500).json({ message: 'Email service unavailable. Please try again.' });
    }
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// 2. VERIFY EMAIL (Yahan par Asal DB mein save hoga)
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    // 1. OTP Collection se record dhoondein
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or not found. Please register again.' });
    }

    // 2. OTP Match karein
    if (otpRecord.otp !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // 3. OTP THEEK HAI! 🎉 Ab Asal DB mein Organization aur User create karein
    const { orgName, userName, password } = otpRecord.userData;

    const organization = await Organization.create({ name: orgName });
    const user = await User.create({
      name: userName, 
      email, 
      password, // Pre-save hook automatically bcrypt kar dega
      role: 'Admin', 
      organizationId: organization._id,
      isEmailVerified: true // Direct verified true set karein
    });

    // 4. Temporary OTP record ko DB se urra dein
    await Otp.findByIdAndDelete(otpRecord._id);
    
    // 5. Dual-tokens issue karein (Login process complete)
    const { accessToken, refreshToken } = generateToken(user._id, user.organizationId, user.role);
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('jwt_refresh', refreshToken, cookieOptions);

    res.status(201).json({
      message: 'Email verified and Account Created Successfully!',
      token: accessToken,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId },
    });

  } catch (error) { 
    res.status(500).json({ message: "Internal Server Error" }); 
  }
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