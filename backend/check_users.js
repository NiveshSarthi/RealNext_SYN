const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
        const users = await User.find({});
        console.log('Users in DB:');
        users.forEach(u => console.log(`- ${u.email} (${u.role})`));
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUsers();
