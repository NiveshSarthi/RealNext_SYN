const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feature = sequelize.define('Feature', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
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
    is_core: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'features',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['code'] },
        { fields: ['category'] },
        { fields: ['is_enabled'] }
    ]
});

module.exports = Feature;
