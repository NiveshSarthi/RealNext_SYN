const mongoose = require('mongoose');
const { Schema } = mongoose;

const clientSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: false
    },
    logo_url: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'suspended', 'cancelled']
    },
    environment: {
        type: String,
        default: 'production',
        enum: ['production', 'demo', 'staging']
    },
    is_demo: {
        type: Boolean,
        default: false
    },
    settings: {
        type: Schema.Types.Mixed,
        default: { features: {}, limits: {} }
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
    collection: 'clients',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for client users
clientSchema.virtual('clientUsers', {
    ref: 'ClientUser',
    localField: '_id',
    foreignField: 'client_id'
});

// Virtual for subscriptions
clientSchema.virtual('subscriptions', {
    ref: 'Subscription',
    localField: '_id',
    foreignField: 'client_id'
});

// Generate unique slug from name
clientSchema.pre('validate', async function () {
    if (!this.slug && this.name) {
        try {
            let baseSlug = this.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            let slug = baseSlug;
            let counter = 1;

            // Use this.constructor instead of mongoose.model('Client')
            while (await this.constructor.findOne({ slug })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            this.slug = slug;
        } catch (error) {
            console.error('Error generating slug:', error);
            throw error;
        }
    }
});

// Virtual for ID
clientSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
