const mongoose = require('mongoose');
require('dotenv').config();

const { User, Client, ClientUser, Plan, Subscription } = require('./models');

async function testCreateClient() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const name = 'Direct Test User';
        const email = 'direct_test_' + Date.now() + '@example.com';
        const password = 'password123';
        const phone = '1234567890';
        const company_name = 'Direct Test Inc';

        console.log('Creating user...');
        const user = await User.create({
            email,
            password_hash: password,
            name,
            phone,
            email_verified: false,
            status: 'active'
        });
        console.log('User created:', user._id);

        console.log('Creating client...');
        const client = await Client.create({
            name: company_name,
            email,
            phone,
            status: 'active',
            environment: 'production'
        });
        console.log('Client created:', client._id);

        console.log('Creating ClientUser...');
        await ClientUser.create({
            user_id: user._id,
            client_id: client._id,
            role: 'admin',
            is_owner: true,
            status: 'active'
        });
        console.log('ClientUser created');

        console.log('Getting trial plan...');
        const defaultPlan = await Plan.findOne({ code: 'trial' });
        if (defaultPlan) {
            console.log('Trial plan found, creating subscription...');
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 14);

            await Subscription.create({
                client_id: client._id,
                plan_id: defaultPlan._id,
                status: 'trial',
                trial_ends_at: trialEndDate
            });
            console.log('Subscription created');
        } else {
            console.log('No trial plan found');
        }

        console.log('Test successful');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testCreateClient();
