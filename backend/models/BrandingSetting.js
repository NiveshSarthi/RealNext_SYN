const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BrandingSetting = sequelize.define('branding_settings', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    owner_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['partner', 'tenant']]
        }
    },
    owner_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    logo_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    favicon_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    primary_color: {
        type: DataTypes.STRING(7),
        allowNull: true
    },
    secondary_color: {
        type: DataTypes.STRING(7),
        allowNull: true
    },
    accent_color: {
        type: DataTypes.STRING(7),
        allowNull: true
    },
    font_family: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    custom_css: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    email_header_html: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    email_footer_html: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'branding_settings',
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['owner_type', 'owner_id'] }
    ]
});

module.exports = BrandingSetting;
