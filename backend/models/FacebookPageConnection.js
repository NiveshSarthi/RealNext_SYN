const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FacebookPageConnection = sequelize.define('facebook_page_connections', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tenant_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    page_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    page_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    access_token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'disconnected'),
        defaultValue: 'active'
    },
    is_lead_sync_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Controls whether leads from this page should be auto-imported'
    },
    last_sync_at: {
        type: DataTypes.DATE
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'facebook_page_connections',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['tenant_id', 'page_id']
        }
    ]
});

module.exports = FacebookPageConnection;
