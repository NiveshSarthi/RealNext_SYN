const mongoose = require('mongoose');
const { Schema } = mongoose;

const loginHistorySchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    login_method: {
        type: String,
        required: false
    },
    ip_address: {
        type: String,
        required: false
    },
    user_agent: {
        type: String,
        required: false
    },
    location: {
        type: String,
        required: false
    },
    success: {
        type: Boolean,
        default: true
    },
    failure_reason: {
        type: String,
        required: false
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'login_history'
});

// Indexes
loginHistorySchema.index({ user_id: 1 });
loginHistorySchema.index({ created_at: -1 });

// Virtual for ID
loginHistorySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

loginHistorySchema.set('toJSON', { virtuals: true });
loginHistorySchema.set('toObject', { virtuals: true });

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);

module.exports = LoginHistory;

