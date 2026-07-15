const rateLimit = require('express-rate-limit');

// 1. Authentication Limiter (Strict - Login/Signup ke liye)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute ka waqt
  max: 5, // Ek IP se 15 minute mein sirf 5 requests allow hain
  message: { 
    message: "Too many login attempts from this IP, please try again after 15 minutes." 
  },
  standardHeaders: true, // Headers mein baki bachi requests ki info return karega
  legacyHeaders: false,
});

// 2. File Upload Limiter (Heavy tasks ke liye)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 1 minute mein 10 files
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