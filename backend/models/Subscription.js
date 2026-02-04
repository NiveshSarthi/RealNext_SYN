const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('subscriptions', {
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
    plan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'plans',
            key: 'id'
        }
    },
    partner_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'partners',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING(30),
        defaultValue: 'trial',
        validate: {
            isIn: [['trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired']]
        }
    },
    billing_cycle: {
        type: DataTypes.STRING(20),
        defaultValue: 'monthly',
        validate: {
            isIn: [['monthly', 'yearly']]
        }
    },
    current_period_start: {
        type: DataTypes.DATE,
        allowNull: false
    },
    current_period_end: {
        type: DataTypes.DATE,
        allowNull: false
    },
    trial_ends_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancel_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    proration_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    external_subscription_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['plan_id'] },
        { fields: ['partner_id'] },
        { fields: ['status'] },
        { fields: ['current_period_end'] }
    ]
});

// Helper to check if subscription is active
Subscription.prototype.isActive = function () {
    return ['trial', 'active'].includes(this.status) &&
        new Date() <= new Date(this.current_period_end);
};

// Helper to check if in trial
Subscription.prototype.isInTrial = function () {
    return this.status === 'trial' &&
        this.trial_ends_at &&
        new Date() <= new Date(this.trial_ends_at);
};

module.exports = Subscription;
