const mongoose = require('mongoose');
const { Schema } = mongoose;

const environmentFlagSchema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: Schema.Types.Mixed,
        required: true
    },
    environment: {
        type: String,
        default: 'all',
        enum: ['all', 'production', 'demo', 'staging']
    },
    description: {
        type: String,
        required: false
    },
    is_enabled: {
        type: Boolean,
        default: true
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'environment_flags'
});

// Virtual for ID
environmentFlagSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

environmentFlagSchema.set('toJSON', { virtuals: true });
environmentFlagSchema.set('toObject', { virtuals: true });

const EnvironmentFlag = mongoose.model('EnvironmentFlag', environmentFlagSchema);

module.exports = EnvironmentFlag;
