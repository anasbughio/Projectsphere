const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/auditLogger');
const cookieOptions = {
  httpOnly: true,
  secure: true, 
  sameSite: 'none', 
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

exports.registerOrg = async (req, res) => {
  try {
    const { orgName, userName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists and is verified' });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const emailHtml = `
      <h2>Welcome to ProjectSphere!</h2>
      <p>Your email verification code is: <strong>${verificationCode}</strong></p>
      <p>This code will expire in 10 minutes. Please enter it in the app to complete your registration.</p>
    `;

   
    await Otp.findOneAndDelete({ email });
    
   
    await Otp.create({
      email,
      otp: verificationCode,
      userData: { orgName, userName, password }
    });
    console.log("---> ✅ Temporary OTP saved in DB");

    sendEmail({ email, subject: 'ProjectSphere - Verify Your Email', html: emailHtml })
      .then(() => console.log("---> 📧 Background Email sent successfully!"))
      .catch((error) => console.error("---> ❌ Background Email failed:", error.message));

    return res.status(200).json({
      message: 'Verification code sent to your email',
      email: email 
    });

  } catch (error) { 
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal Server Error" }); 
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or not found. Please register again.' });
    }

    if (otpRecord.otp !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const { orgName, userName, password } = otpRecord.userData;

    const organization = await Organization.create({ name: orgName });
    const user = await User.create({
      name: userName, 
      email, 
      password, 
      role: 'Org Admin', 
      organizationId: organization._id,
      isEmailVerified: true
    });

    await Otp.findByIdAndDelete(otpRecord._id);
    
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
    console.error("Verify Email Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message }); 
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const organization = await Organization.findById(user.organizationId);
      if (organization?.status === 'Suspended') {
        return res.status(403).json({ message: 'This organization has been blocked by the super admin.' });
      }

      const { accessToken, refreshToken } = generateToken(user._id, user.organizationId, user.role);
      
      await logAudit({
      organizationId: user.organizationId, 
      user: user._id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      details: `${user.name} logged into the system.`
    });
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
      res.cookie('jwt_refresh', refreshToken, cookieOptions);

      res.json({
        message: 'Login successful',
        token: accessToken, // 15-min token
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId,profilePicture: user.profilePicture},
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) { res.status(500).json({ message: "Internal Server Error", errorDetails: error.message }); }
};


exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.jwt_refresh;
    if (!token) return res.status(403).json({ message: 'Access Denied, no refresh token' });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Access Denied, token invalid or revoked' });
    }

    const { accessToken } = generateToken(user._id, user.organizationId, user.role);

    res.json({ token: accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid Refresh Token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.jwt_refresh;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
    }
  } catch (error) {

  }

  res.clearCookie('jwt_refresh', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ message: 'Logged out successfully' });
};

// POST /api/v1/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email" });
    }

    // 2. 6-digit OTP Generate karein
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();
    const emailOptions = {
      email: user.email,
      subject: "ProjectSphere - Password Reset OTP",
      html: `<h3>Your Password Reset OTP is: ${resetOtp}</h3><p>This OTP is valid for 10 minutes.</p>`
    };

    await sendEmail(emailOptions);

    res.status(200).json({ success: true, message: "Password reset OTP sent to email" });

  } catch (error) {
    console.error("---> ❌ Forgot Password Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or Expired OTP" });
    }
   user.password = newPassword;
    // clear previous OTP and expiry after successful reset
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully! You can now login." });

  } catch (error) {
    console.error("---> ❌ Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Koi image upload nahi hui' });
    }

    const imagePath = `/uploads/profiles/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: imagePath },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile picture updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading picture', error: error.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body; // Hum sirf name le rahe hain
    
    if (!name) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { $set: { name: name } }, 
      { returnDocument: 'after', runValidators: true } 
    );

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};


exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // find current user and select password field
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Current password match karein
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // remove manual hashing from here
    // only assign new password and let pre-save middleware handle hashing
    user.password = newPassword; 
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update Password Error:", error);
    res.status(500).json({ message: "Error updating password", error: error.message });
  }
};

exports.getAllUsersForSuperAdmin = async (req, res) => {
  try {
    // not tenant filtering for super admin, fetch all users across organizations
    const users = await User.find({}).populate('organizationId', 'name'); 
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.getTeamMembers = async (req, res) => {
  try {
    const { role, organizationId } = req.user;

    // seperate logic for super admin
    if (role === 'Super Admin') {
      const allOrgAdmins = await User.find({ 
        role: 'Org Admin' 
      }).populate('organizationId', 'name');
      
      return res.status(200).json(allOrgAdmins);
    }

    // organization data for org admin
    const teamMembers = await User.find({ organizationId });
    return res.status(200).json(teamMembers);
    
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
};
exports.deleteMember = async (req, res) => {
  try {
    const memberToDelete = await User.findById(req.params.id);
    if (!memberToDelete) return res.status(404).json({ message: 'User not found' });

    const memberOrgId = memberToDelete.organizationId ? memberToDelete.organizationId.toString() : null;
    const reqUserOrgId = req.user.organizationId ? req.user.organizationId.toString() : null;

    const isOrgAdmin = memberToDelete.role === 'Org Admin';

    // 1. Super Admin access
    if (req.user.role === 'Super Admin') {
      if (isOrgAdmin && memberOrgId) {
        await Organization.findByIdAndUpdate(memberOrgId, { isDeleted: true, status: 'Suspended' });
        await User.updateMany(
          { organizationId: memberOrgId, _id: { $ne: req.params.id } },
          { $set: { isDeleted: true } }
        );
      }

      await User.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: 'User deleted by Super Admin' });
    }

    // 2. Org Admin access: Check IDs using .toString()
    if (memberOrgId && reqUserOrgId && memberOrgId === reqUserOrgId) {
      if (isOrgAdmin) {
        await Organization.findByIdAndUpdate(memberOrgId, { isDeleted: true, status: 'Suspended' });
        await User.updateMany(
          { organizationId: memberOrgId, _id: { $ne: req.params.id } },
          { $set: { isDeleted: true } }
        );
      }

      await User.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: 'Member removed' });
    }

    return res.status(403).json({ message: 'Unauthorized: Access Denied' });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};