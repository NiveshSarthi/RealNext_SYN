const mongoose = require('mongoose');
const { Schema } = mongoose;

const workflowSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    type: {
        type: String,
        default: 'automation',
        enum: ['automation', 'integration', 'notification', 'custom']
    },
    status: {
        type: String,
        default: 'inactive',
        enum: ['active', 'inactive', 'draft', 'error']
    },
    trigger_config: {
        type: Schema.Types.Mixed,
        default: {}
    },
    flow_data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    n8n_workflow_id: {
        type: String,
        required: false
    },
    execution_count: {
        type: Number,
        default: 0
    },
    last_executed_at: {
        type: Date,
        required: false
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
    collection: 'workflows'
});

// Indexes
workflowSchema.index({ client_id: 1, status: 1 });
workflowSchema.index({ n8n_workflow_id: 1 });

// Virtual for ID
workflowSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

workflowSchema.set('toJSON', { virtuals: true });
workflowSchema.set('toObject', { virtuals: true });

const Workflow = mongoose.model('Workflow', workflowSchema);

module.exports = Workflow;

