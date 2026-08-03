const crypto = require('crypto');

// The encryption key MUST be exactly 32 bytes (256 bits) for AES-256.
// We will grab this from your .env file later.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); 
const ALGORITHM = 'aes-256-cbc';

exports.encrypt = (text) => {
  // Generate a random Initialization Vector for each encryption so identical passwords look different
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted
  };
};

exports.decrypt = (encryptedData, iv) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY, 'hex'), 
    Buffer.from(iv, 'hex')
  );
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};