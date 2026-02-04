const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('audit_logs', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    tenant_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    partner_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'partners',
            key: 'id'
        }
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false
        // create, update, delete, login, logout, etc.
    },
    resource_type: {
        type: DataTypes.STRING(100),
        allowNull: false
        // lead, campaign, user, tenant, etc.
    },
    resource_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    changes: {
        type: DataTypes.JSONB,
        defaultValue: {}
        // { before: {...}, after: {...} }
    },
    ip_address: {
        type: DataTypes.INET,
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false, // Audit logs are immutable
    underscored: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['tenant_id'] },
        { fields: ['partner_id'] },
        { fields: ['action'] },
        { fields: ['resource_type'] },
        { fields: ['created_at'] }
    ]
});

module.exports = AuditLog;
