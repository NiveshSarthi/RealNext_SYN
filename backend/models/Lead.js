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
    stage: {
        type: String,
        required: false,
        enum: ['Screening', 'Sourcing', 'Walk-in', 'Closure'],
        default: 'Screening'
    },
    status: {
        type: String,
        default: 'Uncontacted',
        enum: [
            'Uncontacted', 'Not Interested', 'Not Responding', 'Dead', 'Qualified', // Screening
            'Hot', 'Warm', 'Cold', 'Lost', 'Visit expected', 'Schedule', 'Done', // Sourcing
            'Token expected', 'Re-Walkin' // Walk-in
            // Closure uses: 'Hot', 'Warm', 'Cold', 'Lost'
        ]
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
    campaign_name: {
        type: String,
        required: false
    },
    form_name: {
        type: String,
        required: false
    },
    notes: {
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
    activity_logs: [{
        type: {
            type: String,
            enum: ['status_change', 'stage_change', 'note', 'assignment', 'creation', 'field_update'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        old_value: {
            type: String,
            required: false
        },
        new_value: {
            type: String,
            required: false
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        created_at: {
            type: Date,
            default: Date.now
        }
    }],
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

