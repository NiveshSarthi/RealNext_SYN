const mongoose = require('mongoose');
const { Schema } = mongoose;

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    code: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['registration', 'password_reset'],
        default: 'registration'
    },
    expires_at: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index: documents expire at the value of expires_at
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'otps'
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
