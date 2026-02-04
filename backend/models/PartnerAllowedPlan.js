const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PartnerAllowedPlan = sequelize.define('partner_allowed_plans', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    partner_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'partners',
            key: 'id'
        }
    },
    plan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'plans',
            key: 'id'
        }
    },
    custom_price_monthly: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    custom_price_yearly: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'partner_allowed_plans',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['partner_id'] },
        { fields: ['plan_id'] },
        { unique: true, fields: ['partner_id', 'plan_id'] }
    ]
});

module.exports = PartnerAllowedPlan;
