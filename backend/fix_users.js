const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Fix Client User
    let clientUser = await User.findOne({ email: 'testclient@realnext.com' });
    if (clientUser) {
        clientUser.password_hash = 'password123'; // The pre-save hook will hash this
        clientUser.markModified('password_hash');
        await clientUser.save();
    }

    // Fix Team Member
    let teamMember = await User.findOne({ email: 'testteam@realnext.com' });
    if (teamMember) {
        teamMember.password_hash = 'password123';
        teamMember.markModified('password_hash');
        await teamMember.save();
    }

    console.log('Fixed passwords for testclient and testteam.');
    process.exit(0);
}
fix();
