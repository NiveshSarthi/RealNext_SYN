const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TenantUser = sequelize.define('tenant_users', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    role: {
        type: DataTypes.STRING(50),
        defaultValue: 'user',
        validate: {
            isIn: [['admin', 'manager', 'user']]
        }
    },
    permissions: {
        type: DataTypes.JSONB,
        defaultValue: []
        // Example: ["leads:read", "leads:write", "campaigns:read"]
    },
    is_owner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    department: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    tableName: 'tenant_users',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['user_id'] },
        { unique: true, fields: ['tenant_id', 'user_id'] }
    ]
});

module.exports = TenantUser;
