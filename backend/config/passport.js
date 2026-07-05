const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Organization = require('../models/Organization');
// Compute a safe backend base URL for callback. When deployed on Vercel,
// VERCEL_URL is provided (without protocol) for preview/production builds.
const vercelUrl = process.env.VERCEL_URL;
const backendBase = process.env.BACKEND_URL || (vercelUrl ? `https://${vercelUrl}` : undefined);

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('Google OAuth env vars missing: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
}

if (!backendBase) {
  console.warn('BACKEND_URL is not set. Using http://localhost:5000 for callback in development.\nSet BACKEND_URL in your deployment environment (e.g. Vercel) to the public backend URL.');
}

const callbackURL = `${backendBase || 'http://localhost:5000'}/api/v1/auth/google/callback`;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL,
    proxy: true
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