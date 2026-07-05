const express = require('express');
const router = express.Router();
const { registerOrg, login } = require('../controllers/authController');
const generateToken = require('../utils/generateToken');
const passport = require('passport');

// Google login trigger karega
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback route
router.get('/google/callback',
  // If backend fails, send user back to frontend login (use env in production)
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }),
  (req, res) => {
    const token = generateToken(req.user._id, req.user.organizationId, req.user.role);
    const userObj = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      organizationId: req.user.organizationId
    };
    const userDataStr = encodeURIComponent(JSON.stringify(userObj));
    res.redirect(`${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173'}/auth-success?token=${token}&userData=${userDataStr}`);
  }
);
router.post('/register', registerOrg);
router.post('/login', login);
module.exports = router;