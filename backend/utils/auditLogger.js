const AuditLog = require('../models/AuditLog');

/**
 * Reusable function to save audit logs
 */
exports.logAudit = async ({ organizationId, user, action, entityType, entityId, details }) => {
  try {
    await AuditLog.create({
      organizationId,
      user,
      action,
      entityType,
      entityId,
      details
    });
  
    console.log(`[AUDIT] ${action} by User: ${user} on ${entityType}`);
  } catch (error) {
    console.error('Failed to save audit log:', error.message);
  }
};