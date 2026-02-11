const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realnext';
const emailToPromote = 'ratnakerkumar56@gmail.com';

const promoteAdmin = async () => {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to MongoDB');

        // Dynamically require the User model (path is relative to this script in backend/)
        const User = require('./models/User');

        const result = await User.findOneAndUpdate(
            { email: emailToPromote },
            { $set: { is_super_admin: true, status: 'active' } },
            { new: true }
        );

        if (result) {
            console.log(`✅ Success: User ${emailToPromote} is now a Super Admin.`);
            console.log('User status:', result.status);
            console.log('Is Super Admin:', result.is_super_admin);
        } else {
            console.log(`❌ Error: User with email ${emailToPromote} not found.`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Fatal Errror during promotion:', error);
        process.exit(1);
    }
};

promoteAdmin();
