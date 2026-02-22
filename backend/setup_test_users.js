const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function setup() {
    await mongoose.connect(process.env.MONGODB_URI);

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create a Client User
    let clientUser = await User.findOne({ email: 'testclient@realnext.com' });
    if (!clientUser) {
        clientUser = new User({
            name: 'Test Client',
            email: 'testclient@realnext.com',
            password: passwordHash,
            role: 'client',
            is_active: true
        });
        await clientUser.save();
    } else {
        clientUser.password = passwordHash;
        await clientUser.save();
    }

    // 2. Create a Team Member User (requires an organization)
    let teamMember = await User.findOne({ email: 'testteam@realnext.com' });
    if (!teamMember) {
        teamMember = new User({
            name: 'Test Team Member',
            email: 'testteam@realnext.com',
            password: passwordHash,
            role: 'sales', // standard team member role
            organization_id: clientUser._id, // Assign to the client's org
            is_active: true
        });
        await teamMember.save();
    } else {
        teamMember.password = passwordHash;
        teamMember.organization_id = clientUser._id;
        await teamMember.save();
    }

    console.log('--- Test Accounts Created ---');
    console.log('Client Email: testclient@realnext.com | Pass: password123');
    console.log('Team Member Email: testteam@realnext.com | Pass: password123');

    process.exit(0);
}

setup();
