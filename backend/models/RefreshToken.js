const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto');

const refreshTokenSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token_hash: {
        type: String,
        required: true
    },
    device_info: {
        type: String,
        required: false
    },
    ip_address: {
        type: String,
        required: false
    },
    expires_at: {
        type: Date,
        required: true
    },
    revoked_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'refresh_tokens'
});

// Static method to hash a token
refreshTokenSchema.statics.hashToken = function (token) {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Instance method to check if token is valid
refreshTokenSchema.methods.isValid = function () {
    return !this.revoked_at && new Date() < new Date(this.expires_at);
};

// Indexes
refreshTokenSchema.index({ user_id: 1 });
refreshTokenSchema.index({ token_hash: 1 });
refreshTokenSchema.index({ expires_at: 1 });

// Virtual for ID
refreshTokenSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

refreshTokenSchema.set('toJSON', { virtuals: true });
refreshTokenSchema.set('toObject', { virtuals: true });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;

