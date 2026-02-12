const mongoose = require('mongoose');
const { Schema } = mongoose;

const featureSchema = new Schema({
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
    category: {
        type: String,
        required: false
    },
    is_core: {
        type: Boolean,
        default: false
    },
    is_enabled: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'features'
});

// Indexes
featureSchema.index({ code: 1 });

// Virtual for ID
featureSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

featureSchema.set('toJSON', { virtuals: true });
featureSchema.set('toObject', { virtuals: true });

const Feature = mongoose.model('Feature', featureSchema);

module.exports = Feature;

