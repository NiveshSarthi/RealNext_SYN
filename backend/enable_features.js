const mongoose = require('mongoose');
require('dotenv').config();
const { User, Client, ClientUser, Subscription, Plan, Feature } = require('./models');

async function enableFeatures() {
    await mongoose.connect(process.env.MONGODB_URI);

    const clientUser = await User.findOne({ email: 'testclient@realnext.com' });
    const cu = await ClientUser.findOne({ user_id: clientUser._id });
    const client = await Client.findById(cu.client_id);

    // 1. Enable Menu Access
    if (!client.settings) client.settings = {};
    if (!client.settings.menu_access) client.settings.menu_access = {};
    client.settings.menu_access.wa_marketing = true;
    await client.save();
    console.log('Enabled WA Marketing menu access for Client.');

    // 2. Ensure features exist and add to subscription
    const featuresToAdd = ['campaigns', 'workflows', 'templates', 'quick_replies', 'meta_ads'];
    const sub = await Subscription.findOne({ client_id: client._id });

    // Ensure all these features exist in the DB
    const featureIds = [];
    for (const fCode of featuresToAdd) {
        let feature = await Feature.findOne({ code: fCode });
        if (!feature) {
            feature = await Feature.create({
                name: fCode.replace('_', ' ').toUpperCase(),
                code: fCode,
                module: 'wa_marketing',
                is_active: true
            });
        }
        featureIds.push(feature._id);
    }

    // Give the client plan these features if not already present
    const plan = await Plan.findById(sub.plan_id);
    for (const fid of featureIds) {
        const hasFeature = plan.planFeatures?.find(pf => pf.feature_id.toString() === fid.toString());
        if (!hasFeature) {
            if (!plan.planFeatures) plan.planFeatures = [];
            plan.planFeatures.push({
                feature_id: fid,
                is_enabled: true,
                limits: {}
            });
        }
    }
    await plan.save();
    console.log('Enabled WA Marketing underlying features for Client Plan.');

    process.exit(0);
}

enableFeatures();
