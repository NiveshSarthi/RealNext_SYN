const mongoose = require('mongoose');
const { Schema } = mongoose;

const subscriptionUsageSchema = new Schema({
    subscription_id: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true
    },
    feature_code: {
        type: String,
        required: true
    },
    usage_count: {
        type: Number,
        default: 0
    },
    usage_period_start: {
        type: Date,
        required: true
    },
    usage_period_end: {
        type: Date,
        required: true
    },
    reset_at: {
        type: Date,
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'subscription_usage'
});

// Indexes
subscriptionUsageSchema.index({ subscription_id: 1, feature_code: 1, usage_period_start: 1 }, { unique: true });

// Virtual for ID
subscriptionUsageSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

subscriptionUsageSchema.set('toJSON', { virtuals: true });
subscriptionUsageSchema.set('toObject', { virtuals: true });

const SubscriptionUsage = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);

module.exports = SubscriptionUsage;

