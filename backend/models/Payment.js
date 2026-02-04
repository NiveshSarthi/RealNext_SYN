const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('payments', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    invoice_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'invoices',
            key: 'id'
        }
    },
    tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR'
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'completed', 'failed', 'refunded']]
        }
    },
    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true
        // razorpay, stripe, bank_transfer, manual
    },
    gateway_payment_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    gateway_order_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    gateway_signature: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    failure_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    refund_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    refunded_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['invoice_id'] },
        { fields: ['tenant_id'] },
        { fields: ['status'] },
        { fields: ['gateway_payment_id'] },
        { fields: ['gateway_order_id'] }
    ]
});

module.exports = Payment;
