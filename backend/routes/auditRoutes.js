const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// GET /auditlogs endpoint[cite: 1]
// Is par 'protect' lazmi lagana hai taake req.user mil sake
// Aap chahein toh authorize('Super Admin', 'Org Admin') bhi laga sakte hain taake sirf admin dekh sake
router.get('/', protect, getAuditLogs);

module.exports = router;