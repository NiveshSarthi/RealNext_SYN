const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
    invoice_id: {
        type: Schema.Types.ObjectId,
        ref: 'Invoice',
        required: false
    },
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    amount: {
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
        enum: ['pending', 'completed', 'failed', 'refunded']
    },
    payment_method: {
        type: String,
        required: false
    },
    gateway_payment_id: {
        type: String,
        required: false
    },
    gateway_order_id: {
        type: String,
        required: false
    },
    gateway_signature: {
        type: String,
        required: false
    },
    failure_reason: {
        type: String,
        required: false
    },
    refund_amount: {
        type: Number,
        required: false
    },
    refunded_at: {
        type: Date,
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'payments'
});

// Indexes
paymentSchema.index({ invoice_id: 1 });
paymentSchema.index({ client_id: 1 });
paymentSchema.index({ status: 1 });

// Virtual for ID
paymentSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

