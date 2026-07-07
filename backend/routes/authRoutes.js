const express = require('express');
const router = express.Router();
const { registerOrg, login ,refreshToken, logout} = require('../controllers/authController');
const generateToken = require('../utils/generateToken');
const passport = require('passport');

// Google login trigger karega
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback route
router.get('/google/callback',
  // 1. CHANGE HERE: Sirf '/login' likha hai
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
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
    
    // 2. CHANGE HERE: Sirf '/auth-success...' likha hai
    res.redirect(`/auth-success?token=${token}&userData=${userDataStr}`);
  }
);

router.post('/register', registerOrg);
router.post('/login', login);
router.get('/refresh', refreshToken); // 👉 Naya route
router.post('/logout', logout);
module.exports = router;