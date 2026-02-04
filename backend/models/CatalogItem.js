const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CatalogItem = sequelize.define('catalog_items', {
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
    category: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR'
    },
    images: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    properties: {
        type: DataTypes.JSONB,
        defaultValue: {}
        // Custom properties like size, color, etc.
    },
    status: {
        type: DataTypes.STRING(30),
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'inactive', 'draft', 'sold']]
        }
    },
    wa_catalog_id: {
        type: DataTypes.STRING(255),
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
    tableName: 'catalog_items',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['category'] },
        { fields: ['status'] },
        { fields: ['price'] }
    ]
});

module.exports = CatalogItem;
