const mongoose = require('mongoose');
const { Schema } = mongoose;

const followUpSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    lead_id: {
        type: Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    scheduled_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    follow_up_date: {
        type: Date,
        required: true
    },
    follow_up_time: {
        type: String, // "HH:MM" format, e.g. "14:30"
        required: true
    },
    notes: {
        type: String,
        required: false,
        default: ''
    },
    reminder_minutes: {
        type: Number,
        required: false,
        default: null  // null means no reminder
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Rescheduled'],
        default: 'Pending'
    },
    completed_at: {
        type: Date,
        default: null
    },
    rescheduled_from: {
        type: Schema.Types.ObjectId,
        ref: 'FollowUp',
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'followups'
});

// Indexes for efficient querying
followUpSchema.index({ client_id: 1, follow_up_date: 1 });
followUpSchema.index({ client_id: 1, lead_id: 1 });
followUpSchema.index({ client_id: 1, status: 1 });

// Virtual for ID
followUpSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

followUpSchema.set('toJSON', { virtuals: true });
followUpSchema.set('toObject', { virtuals: true });

const FollowUp = mongoose.model('FollowUp', followUpSchema);

module.exports = FollowUp;
