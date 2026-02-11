const mongoose = require('mongoose');
const { Schema } = mongoose;

const facebookPageConnectionSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    page_id: {
        type: String,
        required: true
    },
    page_name: {
        type: String,
        required: true
    },
    access_token: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive', 'disconnected']
    },
    is_lead_sync_enabled: {
        type: Boolean,
        default: true
    },
    last_sync_at: {
        type: Date,
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'facebook_page_connections'
});

// Indexes
facebookPageConnectionSchema.index({ client_id: 1, page_id: 1 }, { unique: true });

// Virtual for ID
facebookPageConnectionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

facebookPageConnectionSchema.set('toJSON', { virtuals: true });
facebookPageConnectionSchema.set('toObject', { virtuals: true });

const FacebookPageConnection = mongoose.model('FacebookPageConnection', facebookPageConnectionSchema);

module.exports = FacebookPageConnection;

