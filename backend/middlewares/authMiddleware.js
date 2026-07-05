const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // User ka data req object mein attach kar rahe hain, password ke baghair
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

// AuthMiddleware.js ke andar yeh function add karein
const normalizeRole = (role) => {
  if (!role) return '';
  const normalized = role.toString().trim().toLowerCase();
  if (['admin', 'org admin', 'organization admin'].includes(normalized)) return 'admin';
  if (['member', 'team member'].includes(normalized)) return 'member';
  if (normalized === 'developer') return 'developer';
  if (normalized === 'designer') return 'designer';
  return normalized;
};

exports.authorizeRoles = (...roles) => {
  const allowedRoles = roles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      console.warn('authorizeRoles blocked request: missing role on user', req.user ? req.user._id : null);
      return res.status(403).json({
        message: 'Access forbidden: your user role is not set or not recognized',
      });
    }

    const userRole = normalizeRole(req.user.role);
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Role (${req.user.role}) is not allowed to access this resource`,
      });
    }
    next();
  };
};