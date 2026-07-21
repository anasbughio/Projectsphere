const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// GET /auditlogs endpoint[cite: 1]
router.get('/', protect, getAuditLogs);

module.exports = router;