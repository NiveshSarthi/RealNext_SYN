const mongoose = require('mongoose');
const { User, Client, ClientUser } = require('./models');
require('dotenv').config();

async function attachClientToTestUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'testclient@realnext.com' });
        if (!user) {
            console.log('testclient not found');
            return;
        }

        let cu = await ClientUser.findOne({ user_id: user._id });
        if (cu) {
            console.log('ClientUser already exists:', cu);
        } else {
            console.log('Creating new Client and ClientUser for testclient...');
            const client = await Client.create({
                name: "Test Client's Organization",
                email: "testclient@realnext.com",
                status: 'active',
                environment: 'production',
                settings: {
                    menu_access: {
                        wa_marketing: true,
                        lms: true
                    },
                    features: {
                        wa_marketing: true,
                        campaigns: true,
                        lms: true
                    }
                }
            });

            cu = await ClientUser.create({
                client_id: client._id,
                user_id: user._id,
                role: 'admin',
                is_owner: true,
                status: 'active'
            });
            console.log('Successfully attached testclient to new Client ID:', client._id);
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

attachClientToTestUser();
