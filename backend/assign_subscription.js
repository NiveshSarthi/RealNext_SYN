require('dotenv').config();
const mongoose = require('mongoose');
const { testConnection } = require('./config/database');
const { User, Client, ClientUser, Subscription, Plan } = require('./models');

async function assignSubscription(email) {
    try {
        console.log(`Assigning subscription to user: ${email}`);
        await testConnection();

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        console.log(`✅ User found: ${user._id}`);

        // Find client user
        const clientUser = await ClientUser.findOne({ user_id: user._id }).populate('client_id');
        if (!clientUser) {
            console.log('❌ No client association found');
            return;
        }
        console.log(`✅ Client found: ${clientUser.client_id.name} (${clientUser.client_id._id})`);

        // Check if subscription already exists
        const existingSub = await Subscription.findOne({
            client_id: clientUser.client_id._id,
            status: { $in: ['trial', 'active'] }
        });
        if (existingSub) {
            console.log('✅ Subscription already exists');
            return;
        }

        // Find starter plan
        const plan = await Plan.findOne({ code: 'starter' });
        if (!plan) {
            console.log('❌ Starter plan not found');
            return;
        }
        console.log(`✅ Plan found: ${plan.name} (${plan._id})`);

        // Create subscription
        const now = new Date();
        const trialDays = plan.trial_days || 14;
        const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

        const subscription = await Subscription.create({
            client_id: clientUser.client_id._id,
            plan_id: plan._id,
            status: 'trial',
            billing_cycle: 'monthly',
            current_period_start: now,
            current_period_end: trialEnd,
            trial_ends_at: trialEnd
        });

        console.log(`✅ Subscription created: ${subscription._id}`);
        console.log('🎉 Subscription assigned successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run with email
const email = process.argv[2] || 'ratnakerkumar57@gmail.com';
assignSubscription(email);