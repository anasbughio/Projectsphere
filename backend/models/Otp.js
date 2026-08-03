const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  userData: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // after 10 mins record automatically delete
});

module.exports = mongoose.model('Otp', otpSchema);