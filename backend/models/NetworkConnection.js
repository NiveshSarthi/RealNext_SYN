const mongoose = require('mongoose');
const { Schema } = mongoose;

const networkConnectionSchema = new Schema({
    from_client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    from_user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to_client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    to_user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'accepted', 'rejected', 'blocked']
    },
    message: {
        type: String,
        required: false
    },
    trust_score: {
        type: Number,
        min: 0,
        max: 100,
        required: false
    },
    collaboration_count: {
        type: Number,
        default: 0
    },
    requested_at: {
        type: Date,
        default: Date.now
    },
    accepted_at: {
        type: Date,
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'network_connections'
});

// Indexes
networkConnectionSchema.index({ from_client_id: 1 });
networkConnectionSchema.index({ to_client_id: 1 });
networkConnectionSchema.index({ status: 1 });

// Virtual for ID
networkConnectionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

networkConnectionSchema.set('toJSON', { virtuals: true });
networkConnectionSchema.set('toObject', { virtuals: true });

const NetworkConnection = mongoose.model('NetworkConnection', networkConnectionSchema);

module.exports = NetworkConnection;

