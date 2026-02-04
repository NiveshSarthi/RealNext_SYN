const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuickReply = sequelize.define('quick_replies', {
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
    shortcut: {
        type: DataTypes.STRING(50),
        allowNull: false
        // e.g., /greet, /intro
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    usage_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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
    tableName: 'quick_replies',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['shortcut'] },
        { fields: ['category'] },
        { unique: true, fields: ['tenant_id', 'shortcut'] }
    ]
});

module.exports = QuickReply;
