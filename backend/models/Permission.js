const mongoose = require('mongoose');
const { Schema } = mongoose;

const permissionSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    category: {
        type: String,
        default: 'general'
    },
    is_system: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'permissions'
});

// Indexes
permissionSchema.index({ code: 1 }, { unique: true });

// Virtual for ID
permissionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

permissionSchema.set('toJSON', { virtuals: true });
permissionSchema.set('toObject', { virtuals: true });

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;

