const mongoose = require('mongoose');
const { Schema } = mongoose;

const invoiceSchema = new Schema({
    invoice_number: {
        type: String,
        required: true,
        unique: true
    },
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    subscription_id: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        required: false
    },
    amount: {
        type: Number,
        required: true
    },
    tax_amount: {
        type: Number,
        default: 0
    },
    total_amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled']
    },
    billing_period_start: {
        type: Date,
        required: false
    },
    billing_period_end: {
        type: Date,
        required: false
    },
    due_date: {
        type: Date,
        required: false
    },
    paid_at: {
        type: Date,
        required: false
    },
    payment_method: {
        type: String,
        required: false
    },
    line_items: {
        type: Schema.Types.Mixed,
        default: []
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'invoices'
});

// Pre-save hook// Generate invoice number before validation
invoiceSchema.pre('validate', async function () {
    if (this.isNew && !this.invoice_number) {
        const date = new Date();
        const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

        const count = await this.constructor.countDocuments({
            created_at: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            }
        });

        this.invoice_number = `${prefix}-${String(count + 1).padStart(5, '0')}`;
    }
});

// Virtual for ID
invoiceSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;

