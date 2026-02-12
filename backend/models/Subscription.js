const mongoose = require('mongoose');
const { Schema } = mongoose;

const subscriptionSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    plan_id: {
        type: Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    status: {
        type: String,
        default: 'trial',
        enum: ['trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired']
    },
    billing_cycle: {
        type: String,
        default: 'monthly',
        enum: ['monthly', 'yearly']
    },
    current_period_start: {
        type: Date,
        required: true
    },
    current_period_end: {
        type: Date,
        required: true
    },
    trial_ends_at: {
        type: Date,
        required: false
    },
    cancelled_at: {
        type: Date,
        required: false
    },
    cancel_reason: {
        type: String,
        required: false
    },
    proration_date: {
        type: Date,
        required: false
    },
    payment_method: {
        type: String,
        required: false
    },
    external_subscription_id: {
        type: String,
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'subscriptions'
});

// Instance methods
subscriptionSchema.methods.isActive = function () {
    return ['trial', 'active'].includes(this.status) &&
        new Date() <= new Date(this.current_period_end);
};

subscriptionSchema.methods.isInTrial = function () {
    return this.status === 'trial' &&
        this.trial_ends_at &&
        new Date() <= new Date(this.trial_ends_at);
};

// Virtual for ID
subscriptionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;

