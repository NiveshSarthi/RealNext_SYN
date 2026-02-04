const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubscriptionUsage = sequelize.define('subscription_usage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    subscription_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'subscriptions',
            key: 'id'
        }
    },
    feature_code: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    usage_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    usage_period_start: {
        type: DataTypes.DATE,
        allowNull: false
    },
    usage_period_end: {
        type: DataTypes.DATE,
        allowNull: false
    },
    reset_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'subscription_usage',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['subscription_id'] },
        { fields: ['feature_code'] },
        { fields: ['usage_period_start', 'usage_period_end'] },
        { unique: true, fields: ['subscription_id', 'feature_code', 'usage_period_start'] }
    ]
});

module.exports = SubscriptionUsage;
