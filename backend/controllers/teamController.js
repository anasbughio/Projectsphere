const User = require('../models/User');
const Invitation = require('../models/Invitation');
const crypto = require('crypto');
const axios = require('axios');


exports.getTeamMembers = async (req, res) => {
  console.log("🔥 TEAM CONTROLLER REACHED!");
  try {
    let members;
    
    // DEBUG: first check who is user and what's his role
    console.log("👤 REQUEST BY:", req.user.role, "| ORG ID:", req.user.organizationId);

    if (req.user.role === 'Super Admin') {
      // find all Org admin
      const allAdmins = await User.find({ role: { $in: ['Org Admin', 'Admin', 'organization admin'] } });
      console.log("🔍 TOTAL ADMINS IN DB:", allAdmins.length);
      
   
      members = await User.find({ 
        role: { $in: ['Org Admin', 'Admin', 'organization admin'] },
        organizationId: { $ne: null } 
      }).populate('organizationId', 'name');
      
      console.log("✅ MEMBERS SENT TO FRONTEND:", members.length);
    } else {
      members = await User.find({ organizationId: req.user.organizationId });
    }

    res.status(200).json(members);
  } catch (error) {
    console.error("❌ ERROR FETCHING TEAM:", error);
    res.status(500).json({ message: 'Error fetching team members', error: error.message });
  }
};
exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const inviter = req.user; 

    //  DYNAMIC LIMIT CHECK: Organization user limit check
    const organization = await Organization.findById(inviter.organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const currentUserCount = await User.countDocuments({ 
      organizationId: inviter.organizationId, 
      isDeleted: false 
    });

    if (currentUserCount >= organization.maxUsers) {
      return res.status(403).json({ 
        message: `User limit reached! Your current plan (${organization.subscriptionPlan.toUpperCase()}) only allows up to ${organization.maxUsers} users. Please upgrade your plan to invite more members.` 
      });
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists in the system." });
    }

    // 2. Clear any old pending invite for this email in this org
    await Invitation.findOneAndDelete({ email, organizationId: inviter.organizationId });

    // 3. Generate secure token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // 4. Save to Database
    const invitation = await Invitation.create({
      email,
      role,
      organizationId: inviter.organizationId,
      inviterId: inviter._id,
      token: inviteToken
    });

    // 5. Setup Link & Email Content
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${FRONTEND_URL}/accept-invite?token=${inviteToken}&email=${email}`;
    const brevoApiKey = process.env.BREVO_API_KEY;

    // 6. Send Email via Brevo
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: "ProjectSphere", email: "anasbughio@gmail.com" },
        to: [{ email: email }],
        subject: `Invitation to join ProjectSphere Workspace`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Hello!</h2>
            <p><strong>${inviter.name}</strong> has invited you to join their workspace on ProjectSphere as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation and set up your account:</p>
            <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #7c7fff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Accept Invitation</a>
            <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
          </div>
        `
      },
      {
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ message: "Invitation sent successfully!", invitation });

  } catch (error) {
    console.error("Invite Error:", error);
    res.status(500).json({ message: "Server error while sending invitation." });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token, email, name, password } = req.body;

    // match email and token in DB
    const invite = await Invitation.findOne({ email, token });
    if (!invite) {
      return res.status(400).json({ message: "Invalid or expired invitation link." });
    }

    // create new user
    const user = await User.create({
      name,
      email,
      password,
      role: invite.role,
      organizationId: invite.organizationId
    });

    // delete DB
    await Invitation.findByIdAndDelete(invite._id);

    res.status(201).json({ message: "Account created successfully. You can now log in." });

  } catch (error) {
    console.error("Accept Invite Error:", error);
    res.status(500).json({ message: "Server error while accepting invitation." });
  }
};
exports.getPendingInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ organizationId: req.user.organizationId }).sort('-createdAt');
    res.status(200).json(invitations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteMember = async (req, res) => {
  try {
    const memberId = req.params.id;
    
    // Admin or Org Admin check 
    const member = await User.findByIdAndDelete(memberId);
    
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};