const mongoose = require('mongoose');
const { Schema } = mongoose;

const facebookLeadFormSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    page_connection_id: {
        type: Schema.Types.ObjectId,
        ref: 'FacebookPageConnection',
        required: true
    },
    form_id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive']
    },
    lead_count: {
        type: Number,
        default: 0
    },
    last_lead_fetched_at: {
        type: Date,
        required: false
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'facebook_lead_forms'
});

// Indexes
facebookLeadFormSchema.index({ client_id: 1, form_id: 1 }, { unique: true });

// Virtual for ID
facebookLeadFormSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

facebookLeadFormSchema.set('toJSON', { virtuals: true });
facebookLeadFormSchema.set('toObject', { virtuals: true });

const FacebookLeadForm = mongoose.model('FacebookLeadForm', facebookLeadFormSchema);

module.exports = FacebookLeadForm;

