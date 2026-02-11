const mongoose = require('mongoose');
const { Schema } = mongoose;

const leadSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: false
    },
    status: {
        type: String,
        default: 'new',
        enum: ['New', 'Contacted', 'Screening', 'Qualified', 'Proposal', 'Negotiation', 'Site Visit', 'Agreement', 'Payment', 'Closed Won']
    },
    source: {
        type: String,
        required: false
    },
    budget_min: {
        type: Number,
        required: false
    },
    budget_max: {
        type: Number,
        required: false
    },
    location: {
        type: String,
        required: false
    },
    ai_score: {
        type: Number,
        min: 0,
        max: 100,
        required: false
    },
    tags: {
        type: [String],
        default: []
    },
    custom_fields: {
        type: Schema.Types.Mixed,
        default: {}
    },
    assigned_to: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    last_contact_at: {
        type: Date,
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
    collection: 'leads'
});

// Indexes
leadSchema.index({ client_id: 1, status: 1 });
leadSchema.index({ client_id: 1, created_at: -1 });

// Virtual for ID
leadSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

leadSchema.set('toJSON', { virtuals: true });
leadSchema.set('toObject', { virtuals: true });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;

