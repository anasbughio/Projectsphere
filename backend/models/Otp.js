const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  userData: { type: Object, required: true }, // Isme hum orgName, userName, password temporary rakhain ge
  createdAt: { type: Date, default: Date.now, expires: 600 } // 🔥 Jadoo: 600 seconds (10 mins) baad yeh record khud delete ho jayega!
});

module.exports = mongoose.model('Otp', otpSchema);