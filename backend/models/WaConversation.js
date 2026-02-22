const mongoose = require('mongoose');
const { Schema } = mongoose;

const waConversationSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    contact_name: {
        type: String,
        required: false
    },
    last_message: {
        type: String,
        required: false
    },
    last_timestamp: {
        type: Date,
        default: Date.now
    },
    unread_count: {
        type: Number,
        default: 0
    },
    phone_number_id: {
        type: String,
        required: false // WhatsApp System Phone Number ID
    },
    status: {
        type: String,
        enum: ['open', 'resolved', 'spam'],
        default: 'open'
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'wa_conversations'
});

// One active conversation per phone number per client
waConversationSchema.index({ client_id: 1, phone_number: 1 }, { unique: true });

// Virtual for ID
waConversationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

waConversationSchema.set('toJSON', { virtuals: true });
waConversationSchema.set('toObject', { virtuals: true });

const WaConversation = mongoose.model('WaConversation', waConversationSchema);

module.exports = WaConversation;
