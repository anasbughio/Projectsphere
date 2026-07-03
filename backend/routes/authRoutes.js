const express = require('express');
const router = express.Router();
const { registerOrg, login } = require('../controllers/authController');
const generateToken = require('../utils/generateToken');
const passport = require('passport');

// Google login trigger karega
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback route
router.get('/google/callback', 
  // Agar backend fail ho toh sidha frontend ke login par bheje
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    // 1. Token generate karein
    const token = generateToken(req.user._id, req.user.organizationId, req.user.role);
    
    // 2. User data ka object banayen jo frontend ko chahiye
    const userObj = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      organizationId: req.user.organizationId
    };

    // 3. User data ko string mein convert aur encode karein taake URL mein safely ja sake
    const userDataStr = encodeURIComponent(JSON.stringify(userObj));
    
    // 4. Token aur userData dono frontend par redirect karein
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}&userData=${userDataStr}`);
  }
);
router.post('/register', registerOrg);
router.post('/login', login);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const token = generateToken(req.user._id, req.user.organizationId, req.user.role);
    res.redirect(`${process.env.CLIENT_URL}/auth-success?token=${token}`);
});
module.exports = router;