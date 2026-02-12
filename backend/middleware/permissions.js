const { ClientUser, Role } = require('../models');
const { ApiError } = require('./errorHandler');

/**
 * Permission checking middleware
 * Checks if the user has the required permission based on their role
 */
const requirePermission = (permissionCode) => {
    return async (req, res, next) => {
        try {
            // Super admins bypass all permission checks
            if (req.user?.is_super_admin) {
                return next();
            }

            // Get the user's client membership
            const clientUser = await ClientUser.findOne({
                user_id: req.user.id,
                client_id: req.client?.id
            }).populate('role_id');

            if (!clientUser) {
                throw ApiError.forbidden('You are not a member of this client');
            }

            // Check if user is client owner (full access)
            if (clientUser.is_owner) {
                return next();
            }

            // Get permissions from role or fallback to legacy role
            let userPermissions = [];

            if (clientUser.role_id) {
                userPermissions = clientUser.role_id.permissions || [];
            } else {
                // Fallback: Get permissions from system role based on legacy role field
                const systemRole = await Role.findOne({
                    client_id: null,
                    name: clientUser.role.charAt(0).toUpperCase() + clientUser.role.slice(1)
                });

                if (systemRole) {
                    userPermissions = systemRole.permissions || [];
                }
            }

            // Check if user has the required permission
            if (!userPermissions.includes(permissionCode)) {
                throw ApiError.forbidden(`You don't have permission to ${permissionCode}`);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if user has ANY of the specified permissions
 */
const requireAnyPermission = (permissionCodes) => {
    return async (req, res, next) => {
        try {
            // Super admins bypass all permission checks
            if (req.user?.is_super_admin) {
                return next();
            }

            const clientUser = await ClientUser.findOne({
                user_id: req.user.id,
                client_id: req.client?.id
            }).populate('role_id');

            if (!clientUser) {
                throw ApiError.forbidden('You are not a member of this client');
            }

            if (clientUser.is_owner) {
                return next();
            }

            let userPermissions = [];

            if (clientUser.role_id) {
                userPermissions = clientUser.role_id.permissions || [];
            } else {
                const systemRole = await Role.findOne({
                    client_id: null,
                    name: clientUser.role.charAt(0).toUpperCase() + clientUser.role.slice(1)
                });

                if (systemRole) {
                    userPermissions = systemRole.permissions || [];
                }
            }

            // Check if user has at least one of the required permissions
            const hasPermission = permissionCodes.some(code => userPermissions.includes(code));

            if (!hasPermission) {
                throw ApiError.forbidden(`You don't have any of the required permissions`);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    requirePermission,
    requireAnyPermission
};
