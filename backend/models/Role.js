const mongoose = require('mongoose');
const { Schema } = mongoose;

const roleSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: false
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    permissions: {
        type: [String],
        default: []
    },
    is_system: {
        type: Boolean,
        default: false
    },
    is_default: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'roles'
});

// Indexes
roleSchema.index({ client_id: 1, name: 1 }, { unique: true });

// Virtual for ID
roleSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

roleSchema.set('toJSON', { virtuals: true });
roleSchema.set('toObject', { virtuals: true });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;

