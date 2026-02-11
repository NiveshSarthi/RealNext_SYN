const mongoose = require('mongoose');
const { Schema } = mongoose;

const planSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    price_monthly: {
        type: Number,
        required: true
    },
    price_yearly: {
        type: Number,
        required: false
    },
    currency: {
        type: String,
        default: 'INR'
    },
    billing_period: {
        type: String,
        default: 'monthly',
        enum: ['monthly', 'yearly', 'custom']
    },
    trial_days: {
        type: Number,
        default: 14
    },
    is_public: {
        type: Boolean,
        default: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    sort_order: {
        type: Number,
        default: 0
    },
    limits: {
        type: Schema.Types.Mixed,
        default: {}
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'plans',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for plan features
planSchema.virtual('planFeatures', {
    ref: 'PlanFeature',
    localField: '_id',
    foreignField: 'plan_id'
});

// Indexes
planSchema.index({ code: 1 });
planSchema.index({ is_active: 1 });

// Virtual for ID
planSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

planSchema.set('toJSON', { virtuals: true });
planSchema.set('toObject', { virtuals: true });

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;

