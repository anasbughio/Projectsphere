const jwt = require('jsonwebtoken');

const generateToken = (userId, organizationId, role) => {
  return jwt.sign(
    { id: userId, organizationId, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

module.exports = generateToken;