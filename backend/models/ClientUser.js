const mongoose = require('mongoose');
const { Schema } = mongoose;

const clientUserSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role_id: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: false
    },
    role: {
        type: String,
        default: 'user',
        enum: ['admin', 'manager', 'user']
    },
    permissions: {
        type: [String],
        default: []
    },
    is_owner: {
        type: Boolean,
        default: false
    },
    department: {
        type: String,
        required: false
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'client_users'
});

// Compound index for unique client_id and user_id
clientUserSchema.index({ client_id: 1, user_id: 1 }, { unique: true });

// Virtual for ID
clientUserSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

clientUserSchema.set('toJSON', { virtuals: true });
clientUserSchema.set('toObject', { virtuals: true });

const ClientUser = mongoose.model('ClientUser', clientUserSchema);

module.exports = ClientUser;
