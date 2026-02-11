const { AuditLog } = require('../models');
const logger = require('../config/logger');

/**
 * Audit Logging Middleware
 * Records user actions for compliance and debugging
 */

/**
 * Create audit log entry
 */
const createAuditLog = async (data) => {
    try {
        await AuditLog.create({
            user_id: data.userId,
            client_id: data.clientId,
            action: data.action,
            resource_type: data.resourceType,
            resource_id: data.resourceId,
            changes: data.changes || {},
            ip_address: data.ipAddress,
            user_agent: data.userAgent,
            metadata: data.metadata || {}
        });
    } catch (error) {
        logger.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break the request
    }
};

/**
 * Middleware to log API actions
 * Usage: router.post('/', auditAction('create', 'lead'), controller.create)
 */
const auditAction = (action, resourceType) => {
    return (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json to capture response
        res.json = function (data) {
            // Only log successful operations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const resourceId = data?.data?.id || req.params.id || null;

                createAuditLog({
                    userId: req.user?._id,
                    clientId: req.client?._id,
                    action,
                    resourceType,
                    resourceId,
                    changes: {
                        request_body: sanitizeForLog(req.body),
                        response_success: data?.success
                    },
                    ipAddress: getClientIp(req),
                    userAgent: req.get('User-Agent'),
                    metadata: {
                        path: req.path,
                        method: req.method
                    }
                });
            }

            return originalJson(data);
        };

        next();
    };
};

/**
 * Log authentication events
 */
const logAuthEvent = async (req, action, success, userId = null, failureReason = null) => {
    await createAuditLog({
        userId: userId || req.user?._id,
        clientId: req.client?._id,
        action,
        resourceType: 'auth',
        resourceId: userId || req.user?._id,
        changes: {
            success,
            failure_reason: failureReason
        },
        ipAddress: getClientIp(req),
        userAgent: req.get('User-Agent'),
        metadata: {
            email: req.body?.email,
            method: req.body?.google_id ? 'google' : 'password'
        }
    });
};

/**
 * Log subscription changes
 */
const logSubscriptionEvent = async (req, action, oldData, newData) => {
    await createAuditLog({
        userId: req.user?._id,
        clientId: req.client?._id,
        action,
        resourceType: 'subscription',
        resourceId: newData?._id || oldData?._id || newData?.id || oldData?.id,
        changes: {
            before: sanitizeForLog(oldData),
            after: sanitizeForLog(newData)
        },
        ipAddress: getClientIp(req),
        userAgent: req.get('User-Agent')
    });
};

/**
 * Get client IP address
 */
const getClientIp = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        null;
};

/**
 * Sanitize data for logging (remove sensitive fields)
 */
const sanitizeForLog = (data) => {
    if (!data) return null;

    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'api_key'];
    const sanitized = { ...data };

    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    return sanitized;
};

/**
 * Query audit logs
 */
const queryAuditLogs = async (filters, pagination = { page: 1, limit: 50 }) => {
    const where = {};

    if (filters.userId) where.user_id = filters.userId;
    if (filters.clientId) where.client_id = filters.clientId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resource_type = filters.resourceType;
    if (filters.resourceId) where.resource_id = filters.resourceId;

    if (filters.startDate || filters.endDate) {
        where.created_at = {};
        if (filters.startDate) where.created_at.$gte = filters.startDate;
        if (filters.endDate) where.created_at.$lte = filters.endDate;
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [rows, count] = await Promise.all([
        AuditLog.find(where)
            .sort({ created_at: -1 })
            .limit(pagination.limit)
            .skip(skip)
            .lean(),
        AuditLog.countDocuments(where)
    ]);

    return { rows, count };
};

module.exports = {
    createAuditLog,
    auditAction,
    logAuthEvent,
    logSubscriptionEvent,
    queryAuditLogs,
    getClientIp
};
