const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String, role: String }));
        const users = await User.find({});
        console.log(JSON.stringify(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })), null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
check();
