const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LoginHistory = sequelize.define('login_history', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    login_method: {
        type: DataTypes.STRING(30),
        allowNull: true
        // password, google, token_refresh
    },
    ip_address: {
        type: DataTypes.INET,
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    location: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    success: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    failure_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'login_history',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['created_at'] },
        { fields: ['success'] }
    ]
});

module.exports = LoginHistory;
