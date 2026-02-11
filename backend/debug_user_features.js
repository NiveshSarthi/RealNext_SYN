const mongoose = require('mongoose');
const { User, ClientUser, Client, Subscription, Plan, PlanFeature, Feature } = require('./models');

async function debugUserFeatures(email) {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synditech_realnext');

        console.log(`\n=== Debugging features for user: ${email} ===`);

        // List all users
        const allUsers = await User.find({}, 'email is_super_admin status');
        console.log(`\n📋 All users in db (${allUsers.length}):`);
        allUsers.forEach(u => console.log(`  - ${u.email} (admin: ${u.is_super_admin}, status: ${u.status})`));

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        console.log(`✅ User found: ${user._id}, status: ${user.status}, is_super_admin: ${user.is_super_admin}`);

        // Find client users
        const clientUsers = await ClientUser.find({ user_id: user._id }).populate('client_id');
        console.log(`\n📋 Client associations (${clientUsers.length}):`);
        if (clientUsers.length === 0) {
            console.log('❌ No client associations found - this is likely the issue!');
            return;
        }

        for (const cu of clientUsers) {
            console.log(`  - Client: ${cu.client_id?.name} (${cu.client_id?._id}), Role: ${cu.role}`);

            // Check subscription
            const subscription = await Subscription.findOne({
                client_id: cu.client_id._id,
                status: { $in: ['trial', 'active'] }
            }).populate({
                path: 'plan_id',
                populate: {
                    path: 'planFeatures',
                    populate: { path: 'feature_id' }
                }
            }).sort({ created_at: -1 });

            if (!subscription) {
                console.log(`    ❌ No active subscription for client ${cu.client_id.name}`);
                continue;
            }

            console.log(`    ✅ Subscription: ${subscription._id}, Plan: ${subscription.plan_id?.name}`);

            // Check plan features
            const planFeatures = subscription.plan_id?.planFeatures || [];
            console.log(`    📦 Plan features (${planFeatures.length}):`);
            const enabledFeatures = [];
            for (const pf of planFeatures) {
                if (pf.is_enabled && pf.feature_id?.is_enabled) {
                    enabledFeatures.push(pf.feature_id.code);
                    console.log(`      ✅ ${pf.feature_id.code}`);
                } else {
                    console.log(`      ❌ ${pf.feature_id?.code} (disabled)`);
                }
            }

            // Check client settings override
            const clientSettings = cu.client_id.settings || {};
            if (clientSettings.features) {
                console.log(`    🔧 Client feature overrides:`);
                Object.keys(clientSettings.features).forEach(code => {
                    const enabled = clientSettings.features[code];
                    console.log(`      ${enabled ? '✅' : '❌'} ${code} (override)`);
                    if (enabled && !enabledFeatures.includes(code)) enabledFeatures.push(code);
                    else if (!enabled) enabledFeatures = enabledFeatures.filter(f => f !== code);
                });
            }

            console.log(`    🎯 Final enabled features for this client: ${enabledFeatures.join(', ') || 'none'}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run with email from args
const email = process.argv[2] || 'ratnakerkumar56@gmail.com';
debugUserFeatures(email);