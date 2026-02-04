const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Workflow = sequelize.define('workflows', {
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
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING(50),
        defaultValue: 'automation',
        validate: {
            isIn: [['automation', 'integration', 'notification', 'custom']]
        }
    },
    status: {
        type: DataTypes.STRING(30),
        defaultValue: 'inactive',
        validate: {
            isIn: [['active', 'inactive', 'draft', 'error']]
        }
    },
    trigger_config: {
        type: DataTypes.JSONB,
        defaultValue: {}
        // Example: { event: "lead_created", conditions: { status: "new" } }
    },
    flow_data: {
        type: DataTypes.JSONB,
        defaultValue: {}
        // n8n workflow definition or custom flow data
    },
    n8n_workflow_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    execution_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_executed_at: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: 'workflows',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['status'] },
        { fields: ['type'] },
        { fields: ['n8n_workflow_id'] }
    ]
});

module.exports = Workflow;
