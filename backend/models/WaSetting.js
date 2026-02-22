const mongoose = require('mongoose');
const { Schema } = mongoose;

const waSettingSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        unique: true
    },
    meta_app_id: {
        type: String,
        required: false
    },
    waba_id: {
        type: String,
        required: false
    },
    system_user_token: {
        type: String,
        required: false
    },
    webhook_verify_token: {
        type: String,
        required: false
    },
    phone_numbers: {
        type: [Schema.Types.Mixed],
        default: []
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'wa_settings'
});

// Virtual for ID
waSettingSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

waSettingSchema.set('toJSON', { virtuals: true });
waSettingSchema.set('toObject', { virtuals: true });

const WaSetting = mongoose.model('WaSetting', waSettingSchema);

module.exports = WaSetting;
