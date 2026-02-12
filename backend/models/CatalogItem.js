const mongoose = require('mongoose');
const { Schema } = mongoose;

const catalogItemSchema = new Schema({
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
    category: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: false
    },
    currency: {
        type: String,
        default: 'INR'
    },
    images: {
        type: Schema.Types.Mixed,
        default: []
    },
    properties: {
        type: Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive', 'draft', 'sold']
    },
    wa_catalog_id: {
        type: String,
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
    collection: 'catalog_items'
});

// Indexes
catalogItemSchema.index({ client_id: 1, category: 1 });
catalogItemSchema.index({ client_id: 1, status: 1 });

// Virtual for ID
catalogItemSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

catalogItemSchema.set('toJSON', { virtuals: true });
catalogItemSchema.set('toObject', { virtuals: true });

const CatalogItem = mongoose.model('CatalogItem', catalogItemSchema);

module.exports = CatalogItem;

