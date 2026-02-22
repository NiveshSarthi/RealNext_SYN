const mongoose = require('mongoose');
const { Schema } = mongoose;

const waContactSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    name: {
        type: String,
        required: false,
        default: ''
    },
    phone: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    custom_attributes: {
        type: Schema.Types.Mixed,
        default: {}
    },
    external_id: {
        type: String,
        required: false // Used for WFB mapping
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'wa_contacts'
});

// Ensure a phone number is unique per client tenant to prevent duplicates
waContactSchema.index({ client_id: 1, phone: 1 }, { unique: true });

// Virtual for ID
waContactSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

waContactSchema.set('toJSON', { virtuals: true });
waContactSchema.set('toObject', { virtuals: true });

const WaContact = mongoose.model('WaContact', waContactSchema);

module.exports = WaContact;
