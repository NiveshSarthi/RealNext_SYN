const axios = require('axios');
const mongoose = require('mongoose');

const FACEBOOK_TOKEN = 'EAATSCZAdh3EYBQpEPZBRI1V9OFh1s7khqSeg7n37EF1s5D8ADHFzjzZAiGzbDZAiWgEY55VhE8ZCyNHzZAU6f8uGktsHkWodUI1qZClfdZBjBfMhC30uw9WvW1RyLuBRoGfNq99XS8pW7pFuaJH6OHEinYxdLkbA5nVz4X0JwObb2QhF2zCvJuyuH6FxZBWZBhIZBlIWTcoMhRHKiIKGkY5fTpHZAYT2EZASyZCQlzqPsGzQ6mcbNAButWcls2IaZCPsDNRzCrIYULNommUfzIb1Pdc4g7FUQIC14ZBknW4B4H8BJAZDZD';

// MongoDB Connection  
mongoose.connect('mongodb://root:Cjmqv@72.61.248.175:5443/?authSource=admin', {
    dbName: 'realnext'
});

const FacebookLeadFormSchema = new mongoose.Schema({
    client_id: String,
    form_id: String,
    form_name: String,
    page_id: String,
    page_name: String,
    status: String,
    leads_count: Number,
    created_at: { type: Date, default: Date.now }
});

const FacebookLeadForm = mongoose.model('FacebookLeadForm', FacebookLeadFormSchema);

async function syncForms() {
    console.log('🔄 SYNCING FORMS DIRECTLY FROM FACEBOOK\n');
    
    try {
        // Get all pages
        const pagesRes = await axios.get(`https://graph.facebook.com/me/accounts`, {
            params: {
                access_token: FACEBOOK_TOKEN,
                limit: 100
            }
        });

        const pages = pagesRes.data.data || [];
        console.log(`📍 Found ${pages.length} pages\n`);

        let totalForms = 0;
        let createdForms = 0;

        for (const page of pages) {
            try {
                // Get forms for each page
                const formsRes = await axios.get(`https://graph.facebook.com/${page.id}/leadgen_forms`, {
                    params: {
                        access_token: page.access_token,
                        fields: 'id,name,status,leads_count',
                        limit: 100
                    }
                });

                const forms = formsRes.data.data || [];
                console.log(`${page.name}: ${forms.length} forms`);

                // Insert forms into database
                for (const form of forms) {
                    totalForms++;
                    
                    // Check if form already exists
                    const existing = await FacebookLeadForm.findOne({
                        form_id: form.id
                    });

                    if (!existing) {
                        await FacebookLeadForm.create({
                            client_id: 'default', // Will be set by UI
                            form_id: form.id,
                            form_name: form.name,
                            page_id: page.id,
                            page_name: page.name,
                            status: form.status,
                            leads_count: form.leads_count || 0
                        });
                        createdForms++;
                        console.log(`   ✅ ${form.name}`);
                    } else {
                        console.log(`   ⏭️  ${form.name} (already exists)`);
                    }
                }
            } catch (pageError) {
                console.log(`   ❌ Error: ${pageError.message}`);
            }
        }

        console.log(`\n✅ SYNC COMPLETE:`);
        console.log(`   Total Forms Found: ${totalForms}`);
        console.log(`   New Forms Created: ${createdForms}`);

        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        mongoose.disconnect();
    }
}

syncForms();
