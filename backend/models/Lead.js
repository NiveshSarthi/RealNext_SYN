const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lead = sequelize.define('leads', {
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
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'new',
        validate: {
            isIn: [['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']]
        }
    },
    source: {
        type: DataTypes.STRING(100),
        allowNull: true
        // facebook, website, manual, import, whatsapp, meta_ads
    },
    budget_min: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },
    budget_max: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    ai_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    tags: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    custom_fields: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    last_contact_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'leads',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['status'] },
        { fields: ['source'] },
        { fields: ['assigned_to'] },
        { fields: ['ai_score'] },
        { fields: ['created_at'] }
    ]
});

module.exports = Lead;
