const mongoose = require('mongoose');
const { Schema } = mongoose;

const waMessageSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    conversation_id: {
        type: Schema.Types.ObjectId,
        ref: 'WaConversation',
        required: true
    },
    body: {
        type: String,
        required: true
    },
    direction: {
        type: String,
        enum: ['incoming', 'outgoing'],
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'template', 'image', 'video', 'document', 'audio', 'location', 'contacts', 'interactive', 'system'],
        default: 'text'
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed', 'received'],
        required: false
    },
    external_id: {
        type: String, // Facebook/WhatsApp Message ID
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'wa_messages'
});

// Index for fast query of messages in a conversation
waMessageSchema.index({ conversation_id: 1, timestamp: 1 });
waMessageSchema.index({ client_id: 1 });

// Virtual for ID
waMessageSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

waMessageSchema.set('toJSON', { virtuals: true });
waMessageSchema.set('toObject', { virtuals: true });

const WaMessage = mongoose.model('WaMessage', waMessageSchema);

module.exports = WaMessage;
