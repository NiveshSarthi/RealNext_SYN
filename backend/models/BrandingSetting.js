const mongoose = require('mongoose');
const { Schema } = mongoose;

const brandingSettingSchema = new Schema({
    owner_type: {
        type: String,
        required: true,
        enum: ['partner', 'tenant']
    },
    owner_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    logo_url: {
        type: String,
        required: false
    },
    favicon_url: {
        type: String,
        required: false
    },
    primary_color: {
        type: String,
        required: false
    },
    secondary_color: {
        type: String,
        required: false
    },
    accent_color: {
        type: String,
        required: false
    },
    font_family: {
        type: String,
        required: false
    },
    custom_css: {
        type: String,
        required: false
    },
    email_header_html: {
        type: String,
        required: false
    },
    email_footer_html: {
        type: String,
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'branding_settings'
});

// Indexes
brandingSettingSchema.index({ owner_type: 1, owner_id: 1 }, { unique: true });

// Virtual for ID
brandingSettingSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

brandingSettingSchema.set('toJSON', { virtuals: true });
brandingSettingSchema.set('toObject', { virtuals: true });

const BrandingSetting = mongoose.model('BrandingSetting', brandingSettingSchema);

module.exports = BrandingSetting;

