const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Campaign = sequelize.define('campaigns', {
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
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    type: {
        type: DataTypes.STRING(50),
        defaultValue: 'broadcast',
        validate: {
            isIn: [['broadcast', 'drip', 'triggered', 'scheduled']]
        }
    },
    status: {
        type: DataTypes.STRING(30),
        defaultValue: 'draft',
        validate: {
            isIn: [['draft', 'scheduled', 'running', 'completed', 'failed', 'paused']]
        }
    },
    template_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    template_data: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    target_audience: {
        type: DataTypes.JSONB,
        defaultValue: {}
        // Example: { filters: { status: ["new", "contacted"] }, tag_ids: [], count: 100 }
    },
    scheduled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    stats: {
        type: DataTypes.JSONB,
        defaultValue: { sent: 0, delivered: 0, read: 0, failed: 0, replied: 0 }
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'campaigns',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['status'] },
        { fields: ['type'] },
        { fields: ['scheduled_at'] },
        { fields: ['created_by'] }
    ]
});

module.exports = Campaign;
