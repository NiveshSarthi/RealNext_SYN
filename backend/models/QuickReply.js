const mongoose = require('mongoose');
const { Schema } = mongoose;

const quickReplySchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    shortcut: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: false
    },
    usage_count: {
        type: Number,
        default: 0
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
    collection: 'quick_replies'
});

// Indexes
quickReplySchema.index({ client_id: 1, shortcut: 1 }, { unique: true });

// Virtual for ID
quickReplySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

quickReplySchema.set('toJSON', { virtuals: true });
quickReplySchema.set('toObject', { virtuals: true });

const QuickReply = mongoose.model('QuickReply', quickReplySchema);

module.exports = QuickReply;

