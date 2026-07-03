const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Organization = require('../models/Organization');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Production aur Local dono ke liye dynamic URL:
    callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/google/callback` 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check karein ke user pehle se database mein hai ya nahi
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        return done(null, user);
      }

      // 1. Agar naya user hai, toh sab se pehle uski Organization banayen
      const newOrg = await Organization.create({
        name: `${profile.displayName}'s Workspace`, 
      });

      // 2. Phir naya User banayen aur usko naye Organization ki ID de dein
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'Admin', // Naye workspace ka yeh khud Admin hoga
        organizationId: newOrg._id, 
      });
      
      return done(null, user);
    } catch (error) {
      console.log("Google Auth Error:", error);
      return done(error, null);
    }
  }
));