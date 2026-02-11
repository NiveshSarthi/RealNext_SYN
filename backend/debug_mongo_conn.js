const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./models');

const test = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('SUCCESS: Connected to MongoDB');
        console.log('Connected DB Name:', mongoose.connection.name);
        console.log('Model User collection name:', User.collection.name);
        const users = await User.find({}, 'email');
        console.log('Users found:', JSON.stringify(users));
        process.exit(0);
    } catch (err) {
        console.error('FAILURE:', err.message);
        console.log('Full Error:', err);
        process.exit(1);
    }
};

test();
