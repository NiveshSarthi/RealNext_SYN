const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlanFeature = sequelize.define('plan_features', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    plan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'plans',
            key: 'id'
        }
    },
    feature_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'features',
            key: 'id'
        }
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    limits: {
        type: DataTypes.JSONB,
        defaultValue: {}
        // Example: { max_leads: 1000, max_campaigns: 10, daily_messages: 500 }
    }
}, {
    tableName: 'plan_features',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['plan_id'] },
        { fields: ['feature_id'] },
        { unique: true, fields: ['plan_id', 'feature_id'] }
    ]
});

module.exports = PlanFeature;
