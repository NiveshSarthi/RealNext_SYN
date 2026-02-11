const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realnext';

const checkUser = async () => {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to MongoDB');

        const User = require('./backend/models/User');
        const user = await User.findOne({ email: 'ratnakerkumar56@gmail.com' });

        if (user) {
            console.log('User found:');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('User not found');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
