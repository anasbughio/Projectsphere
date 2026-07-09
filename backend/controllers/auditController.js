const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    // Sirf us organization ke logs fetch karein jis se user belong karta hai
    const logs = await AuditLog.find({ organizationId: req.user.organizationId })
      .populate('user', 'name email') // User ka naam aur email sath layen
      .sort({ createdAt: -1 }) // Sab se latest logs pehle aayenge
      .limit(100); // UI par overload se bachne ke liye limit laga di hai

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
};