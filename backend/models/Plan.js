const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Plan = sequelize.define('plans', {
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
    price_monthly: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    price_yearly: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR'
    },
    billing_period: {
        type: DataTypes.STRING(20),
        defaultValue: 'monthly',
        validate: {
            isIn: [['monthly', 'yearly', 'custom']]
        }
    },
    trial_days: {
        type: DataTypes.INTEGER,
        defaultValue: 14
    },
    is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    limits: {
        type: DataTypes.JSONB,
        defaultValue: {}
        // Example: { max_users: 10, storage_gb: 5 }
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'plans',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['code'] },
        { fields: ['is_active'] },
        { fields: ['is_public'] }
    ]
});

module.exports = Plan;
