const mongoose = require('mongoose');
const { Schema } = mongoose;

const flowSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    description: {
        type: String,
        default: ''
    },
    Message_Blocks: {
        type: [Schema.Types.Mixed], // Storing as Mixed array to be flexible with guide spec
        default: []
    },
    Message_Routes: {
        type: [Schema.Types.Mixed], // Storing as Mixed array to be flexible with guide spec
        default: []
    },
    is_active: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'flows'
});

// Indexes
flowSchema.index({ client_id: 1, updated_at: -1 });

// Virtual for ID
flowSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

flowSchema.set('toJSON', { virtuals: true });
flowSchema.set('toObject', { virtuals: true });

const Flow = mongoose.model('Flow', flowSchema);

module.exports = Flow;
