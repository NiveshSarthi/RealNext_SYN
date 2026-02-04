const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NetworkConnection = sequelize.define('network_connections', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    from_tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    from_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    to_tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    to_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING(30),
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'accepted', 'rejected', 'blocked']]
        }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    trust_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    collaboration_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    requested_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    accepted_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'network_connections',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['from_tenant_id'] },
        { fields: ['to_tenant_id'] },
        { fields: ['from_user_id'] },
        { fields: ['to_user_id'] },
        { fields: ['status'] }
    ]
});

module.exports = NetworkConnection;
