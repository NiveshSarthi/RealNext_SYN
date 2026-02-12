const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditLogSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: false
    },
    action: {
        type: String,
        required: true
    },
    resource_type: {
        type: String,
        required: true
    },
    resource_id: {
        type: Schema.Types.ObjectId,
        required: false
    },
    changes: {
        type: Schema.Types.Mixed,
        default: {}
    },
    ip_address: {
        type: String,
        required: false
    },
    user_agent: {
        type: String,
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'audit_logs'
});

// Indexes
auditLogSchema.index({ user_id: 1 });
auditLogSchema.index({ client_id: 1 });
auditLogSchema.index({ created_at: -1 });

// Virtual for ID
auditLogSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

auditLogSchema.set('toJSON', { virtuals: true });
auditLogSchema.set('toObject', { virtuals: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;

