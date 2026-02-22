const mongoose = require('mongoose');
const { User, ClientUser, Client } = require('./models');
require('dotenv').config();

async function checkClientStatus() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'testclient@realnext.com' });
    const cu = await ClientUser.findOne({ user_id: user._id });
    const client = await Client.findById(cu.client_id);
    console.log('User:', user.email);
    console.log('Client Name:', client.name);
    console.log('Client Status:', client.status);
    mongoose.disconnect();
}
checkClientStatus();
