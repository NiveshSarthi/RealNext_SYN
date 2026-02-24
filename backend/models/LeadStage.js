const mongoose = require('mongoose');

const leadStageSchema = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: '#f49d25'
    },
    order: {
        type: Number,
        default: 0
    },
    is_default: {
        type: Boolean,
        default: false
    },
    status_mapping: [{
        type: String
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update the updated_at field on save
leadStageSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('LeadStage', leadStageSchema);
