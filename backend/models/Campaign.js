const mongoose = require('mongoose');
const { Schema } = mongoose;

const campaignSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'broadcast',
        enum: ['broadcast', 'drip', 'triggered', 'scheduled']
    },
    status: {
        type: String,
        default: 'draft',
        enum: ['draft', 'scheduled', 'running', 'completed', 'failed', 'paused']
    },
    template_name: {
        type: String,
        required: false
    },
    template_data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    target_audience: {
        type: Schema.Types.Mixed,
        default: {}
    },
    scheduled_at: {
        type: Date,
        required: false
    },
    started_at: {
        type: Date,
        required: false
    },
    completed_at: {
        type: Date,
        required: false
    },
    stats: {
        type: Schema.Types.Mixed,
        default: { sent: 0, delivered: 0, read: 0, failed: 0, replied: 0 }
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'campaigns'
});

// Indexes
campaignSchema.index({ client_id: 1, status: 1 });
campaignSchema.index({ client_id: 1, created_at: -1 });

// Virtual for ID
campaignSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;

