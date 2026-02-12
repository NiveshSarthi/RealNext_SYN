const mongoose = require('mongoose');
const { Schema } = mongoose;

const planFeatureSchema = new Schema({
    plan_id: {
        type: Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    feature_id: {
        type: Schema.Types.ObjectId,
        ref: 'Feature',
        required: true
    },
    is_enabled: {
        type: Boolean,
        default: true
    },
    limits: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'plan_features'
});

// Indexes
planFeatureSchema.index({ plan_id: 1, feature_id: 1 }, { unique: true });

// Virtual for ID
planFeatureSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

planFeatureSchema.set('toJSON', { virtuals: true });
planFeatureSchema.set('toObject', { virtuals: true });

const PlanFeature = mongoose.model('PlanFeature', planFeatureSchema);

module.exports = PlanFeature;

