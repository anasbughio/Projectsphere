const express = require('express');
const router = express.Router();
const { registerOrg, login, refreshToken, logout, verifyEmail, forgotPassword,
   resetPassword ,uploadProfilePicture,updateProfile,updatePassword,getAllUsersForSuperAdmin,getTeamMembers,deleteMember,getMe} = require('../controllers/authController');
const generateToken = require('../utils/generateToken');
const passport = require('passport');
const { protect,authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const { authLimiter } = require('../middlewares/rateLimiter');


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const result = await generateToken(req.user._id, req.user.organizationId, req.user.role);
    
      let actualToken = result;
      if (result && typeof result === 'object') {
        actualToken = result.token || result.accessToken;
      }

      const userObj = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        organizationId: req.user.organizationId
      };
      
      const userDataStr = encodeURIComponent(JSON.stringify(userObj));
      res.redirect(`${FRONTEND_URL}/auth-success?token=${actualToken}&userData=${userDataStr}`);

    } catch (error) {
      console.error("Google Callback Error:", error);
      res.redirect(`${FRONTEND_URL}/login?error=server_error`);
    }
  }
);

router.post('/register', authLimiter,registerOrg);
router.post('/verify-email', verifyEmail);
router.post('/login', authLimiter,login);
router.get('/refresh', refreshToken); 
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/profile-picture', protect, upload.single('profileImage'), uploadProfilePicture);
router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);
router.get('/all-platform-users', protect, authorizeRoles('Super Admin'), getAllUsersForSuperAdmin);
router.get('/me', protect,getMe);

module.exports = router;