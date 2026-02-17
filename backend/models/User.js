const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password_hash: {
        type: String,
        required: false // Null for OAuth-only users
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: false
    },
    avatar_url: {
        type: String,
        required: false
    },
    google_id: {
        type: String,
        required: false,
        unique: true,
        sparse: true // Allow multiple nulls
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    system_role_id: {
        type: String, // Storing as String/UUID for now to match legacy
        required: false
    },
    is_super_admin: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'suspended', 'pending']
    },
    last_login_at: {
        type: Date,
        required: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    deleted_at: {
        type: Date,
        default: null
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'users'
});

// Instance methods
userSchema.methods.validatePassword = async function (password) {
    if (!this.password_hash) return false;
    return bcrypt.compare(password, this.password_hash);
};

userSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();
    delete obj.password_hash;
    // Map _id to id for compatibility
    obj.id = obj._id.toString();
    return obj;
};

// Hooks
userSchema.pre('save', async function () {
    try {
        if (!this.isModified('password_hash')) return;

        if (this.password_hash) {
            console.log(`DEBUG: Hashing password for user: ${this.email}`);
            const salt = await bcrypt.genSalt(12);
            this.password_hash = await bcrypt.hash(this.password_hash, salt);
            console.log(`DEBUG: Hashing complete for user: ${this.email}`);
        }
    } catch (err) {
        console.error('ERROR in User pre-save hook:', err);
        throw err;
    }
});

// Virtual for ID
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;

