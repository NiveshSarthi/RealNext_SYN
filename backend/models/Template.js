const mongoose = require('mongoose');
const { Schema } = mongoose;

const templateSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: false
    },
    language: {
        type: String,
        default: 'en'
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected', 'disabled']
    },
    components: {
        type: Schema.Types.Mixed,
        required: true
    },
    header_type: {
        type: String,
        required: false
    },
    body_text: {
        type: String,
        required: false
    },
    footer_text: {
        type: String,
        required: false
    },
    buttons: {
        type: Schema.Types.Mixed,
        default: []
    },
    wa_template_id: {
        type: String,
        required: false
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
    collection: 'templates'
});

// Indexes
templateSchema.index({ client_id: 1, status: 1 });
templateSchema.index({ client_id: 1, name: 1 });

// Virtual for ID
templateSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

templateSchema.set('toJSON', { virtuals: true });
templateSchema.set('toObject', { virtuals: true });

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;

