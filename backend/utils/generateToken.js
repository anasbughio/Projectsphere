const jwt = require('jsonwebtoken');

const generateToken = (userId, organizationId, role) => {
  // 1. Short-lived Access Token (15 minutes)
  const accessToken = jwt.sign(
    { id: userId, organizationId, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '15m' }
  );

  // 2. Long-lived Refresh Token (7 days)
  const refreshToken = jwt.sign(
    { id: userId }, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

module.exports = generateToken;