const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const RefreshToken = sequelize.define('refresh_tokens', {
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
    token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    device_info: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ip_address: {
        type: DataTypes.INET,
        allowNull: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    revoked_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'refresh_tokens',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['token_hash'] },
        { fields: ['expires_at'] }
    ]
});

// Static method to hash a token
RefreshToken.hashToken = function (token) {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Instance method to check if token is valid
RefreshToken.prototype.isValid = function () {
    return !this.revoked_at && new Date() < new Date(this.expires_at);
};

module.exports = RefreshToken;
