const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Template = sequelize.define('templates', {
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
    category: {
        type: DataTypes.STRING(50),
        allowNull: true
        // marketing, utility, authentication
    },
    language: {
        type: DataTypes.STRING(10),
        defaultValue: 'en'
    },
    status: {
        type: DataTypes.STRING(30),
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'approved', 'rejected', 'disabled']]
        }
    },
    components: {
        type: DataTypes.JSONB,
        allowNull: false
        // WhatsApp template components
    },
    header_type: {
        type: DataTypes.STRING(30),
        allowNull: true
        // text, image, video, document
    },
    body_text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    footer_text: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    buttons: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    wa_template_id: {
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
    tableName: 'templates',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['status'] },
        { fields: ['category'] },
        { fields: ['name'] }
    ]
});

module.exports = Template;
