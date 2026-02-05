const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FacebookLeadForm = sequelize.define('facebook_lead_forms', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenant_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    page_connection_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'facebook_page_connections',
            key: 'id'
        }
    },
    form_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    lead_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_lead_fetched_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'facebook_lead_forms',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['tenant_id', 'form_id']
        }
    ]
});

module.exports = FacebookLeadForm;
