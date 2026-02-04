const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('invoices', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    invoice_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    subscription_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'subscriptions',
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
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    total_amount: {
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
            isIn: [['pending', 'paid', 'failed', 'refunded', 'cancelled']]
        }
    },
    billing_period_start: {
        type: DataTypes.DATE,
        allowNull: true
    },
    billing_period_end: {
        type: DataTypes.DATE,
        allowNull: true
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    paid_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    line_items: {
        type: DataTypes.JSONB,
        defaultValue: []
        // Example: [{ description: "Professional Plan - Monthly", amount: 999, quantity: 1 }]
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'invoices',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['subscription_id'] },
        { fields: ['partner_id'] },
        { fields: ['status'] },
        { fields: ['invoice_number'] }
    ]
});

// Generate invoice number before creation
Invoice.beforeCreate(async (invoice) => {
    if (!invoice.invoice_number) {
        const date = new Date();
        const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const count = await Invoice.count({
            where: sequelize.where(
                sequelize.fn('date_trunc', 'month', sequelize.col('created_at')),
                sequelize.fn('date_trunc', 'month', sequelize.literal('CURRENT_DATE'))
            )
        });
        invoice.invoice_number = `${prefix}-${String(count + 1).padStart(5, '0')}`;
    }
});

module.exports = Invoice;
