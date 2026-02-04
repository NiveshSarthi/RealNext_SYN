const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EnvironmentFlag = sequelize.define('environment_flags', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    value: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    environment: {
        type: DataTypes.STRING(20),
        defaultValue: 'all',
        validate: {
            isIn: [['all', 'production', 'demo', 'staging']]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'environment_flags',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['key'] },
        { fields: ['environment'] },
        { fields: ['is_enabled'] }
    ]
});

module.exports = EnvironmentFlag;
