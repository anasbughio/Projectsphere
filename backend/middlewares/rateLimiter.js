const rateLimit = require('express-rate-limit');

// 1. Authentication Limiter (Strict - Login/Signup)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // only 15 min 
  max: 5, // From 1 IP there are only 5 requests in 15min
  message: { 
    message: "Too many login attempts from this IP, please try again after 15 minutes." 
  },
  standardHeaders: true, // return remaining info in headers
  legacyHeaders: false,
});

// 2. File Upload Limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 files in 1 minute
  message: { 
    message: "Too many files uploaded. Please wait a minute." 
  }
});

// 3. General API Limiter (Normal routes ke liye)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 15 minute mein 100 requests
  message: { 
    message: "Too many requests from this IP, please try again later." 
  }
});

module.exports = {
  authLimiter,
  uploadLimiter,
  apiLimiter
};