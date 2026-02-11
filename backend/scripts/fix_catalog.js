const mongoose = require('mongoose');
require('dotenv').config();

async function fixCatalog() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const { Feature, Plan, PlanFeature, CatalogItem, Client } = require('../models');

        // 1. Ensure 'catalog' feature exists
        let catalogFeature = await Feature.findOne({ code: 'catalog' });
        if (!catalogFeature) {
            console.log('Creating catalog feature...');
            catalogFeature = await Feature.create({
                code: 'catalog',
                name: 'Property Catalog',
                description: 'Manage property inventory',
                category: 'inventory',
                is_enabled: true
            });
        } else {
            console.log('Catalog feature already exists');
            catalogFeature.is_enabled = true;
            await catalogFeature.save();
        }

        // 2. Enable for all plans
        const plans = await Plan.find({});
        for (const plan of plans) {
            const pf = await PlanFeature.findOne({ plan_id: plan._id, feature_id: catalogFeature._id });
            if (!pf) {
                console.log(`Enabling catalog for plan: ${plan.name}`);
                await PlanFeature.create({
                    plan_id: plan._id,
                    feature_id: catalogFeature._id,
                    is_enabled: true
                });
            } else {
                pf.is_enabled = true;
                await pf.save();
            }
        }

        // 3. Create a test property if none exist
        const itemCount = await CatalogItem.countDocuments({});
        if (itemCount === 0) {
            const client = await Client.findOne({});
            if (client) {
                console.log(`Creating test property for client: ${client.name}`);
                await CatalogItem.create({
                    client_id: client._id,
                    name: 'Sunset Villa',
                    description: 'Luxury villa with sea view',
                    category: 'Villa',
                    price: 25000000,
                    currency: 'INR',
                    status: 'active',
                    properties: {
                        bhk: '4',
                        area: '3500'
                    },
                    images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=400']
                });
            }
        }

        console.log('Done!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

fixCatalog();
