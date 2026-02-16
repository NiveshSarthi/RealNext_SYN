const axios = require('axios');

const TOKEN = 'EAATSCZAdh3EYBQpEPZBRI1V9OFh1s7khqSeg7n37EF1s5D8ADHFzjzZAiGzbDZAiWgEY55VhE8ZCyNHzZAU6f8uGktsHkWodUI1qZClfdZBjBfMhC30uw9WvW1RyLuBRoGfNq99XS8pW7pFuaJH6OHEinYxdLkbA5nVz4X0JwObb2QhF2zCvJuyuH6FxZBWZBhIZBlIWTcoMhRHKiIKGkY5fTpHZAYT2EZASyZCQlzqPsGzQ6mcbNAButWcls2IaZCPsDNRzCrIYULNommUfzIb1Pdc4g7FUQIC14ZBknW4B4H8BJAZDZD';

async function checkToken() {
    console.log('🔍 Checking Facebook Token...\n');

    try {
        // Test 1: Token validity
        console.log('📌 Test 1: Token Validity');
        const meRes = await axios.get('https://graph.facebook.com/me', {
            params: { access_token: TOKEN }
        });
        console.log(`✅ Token is VALID\n`);
        console.log(`   User ID: ${meRes.data.id}`);
        console.log(`   Name: ${meRes.data.name}\n`);

        // Test 2: Token permissions
        console.log('📌 Test 2: Token Permissions');
        const permsRes = await axios.get('https://graph.facebook.com/me/permissions', {
            params: { access_token: TOKEN }
        });
        const permissions = permsRes.data.data.map(p => p.permission);
        console.log(`✅ Found ${permissions.length} permissions:\n`);
        permissions.forEach(p => console.log(`   - ${p}`));

        const requiredPerms = [
            'pages_read_engagement',
            'pages_manage_metadata',
            'pages_read_user_content',
            'leads_retrieval',
            'pages_manage_ads'
        ];
        console.log('\n📌 Required Permissions Check:');
        const missingPerms = requiredPerms.filter(p => !permissions.includes(p));
        if (missingPerms.length > 0) {
            console.log(`⚠️  MISSING PERMISSIONS (${missingPerms.length}):`);
            missingPerms.forEach(p => console.log(`   ❌ ${p}`));
        } else {
            console.log('✅ All required permissions present!');
        }

        // Test 3: Get pages
        console.log('\n📌 Test 3: Accessible Facebook Pages');
        const pagesRes = await axios.get('https://graph.facebook.com/me/accounts', {
            params: {
                access_token: TOKEN,
                fields: 'id,name,access_token',
                limit: 100
            }
        });
        const pages = pagesRes.data.data || [];
        console.log(`✅ Found ${pages.length} pages:\n`);
        
        for (const page of pages) {
            console.log(`   📄 ${page.name}`);
            console.log(`      ID: ${page.id}`);

            // Get forms for this page
            try {
                const formsRes = await axios.get(`https://graph.facebook.com/${page.id}/leadgen_forms`, {
                    params: {
                        access_token: page.access_token,
                        fields: 'id,name,status,leads_count',
                        limit: 100
                    }
                });
                const forms = formsRes.data.data || [];
                console.log(`      Forms: ${forms.length}`);
                if (forms.length > 0) {
                    forms.slice(0, 3).forEach(f => {
                        console.log(`         - ${f.name} (${f.status}, ${f.leads_count} leads)`);
                    });
                    if (forms.length > 3) {
                        console.log(`         ... and ${forms.length - 3} more forms`);
                    }
                }
            } catch (formErr) {
                console.log(`      Forms: ERROR - ${formErr.response?.data?.error?.message || formErr.message}`);
            }
            console.log();
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Token Status: VALID`);
        console.log(`📄 Pages Accessible: ${pages.length}`);
        console.log(`⚠️  Missing Permissions: ${missingPerms.length}`);
        
        if (missingPerms.length > 0) {
            console.log('\n🎯 ACTION REQUIRED:');
            console.log('   Add these permissions in Facebook Developer Console:');
            missingPerms.forEach(p => console.log(`   - ${p}`));
            console.log('\n   Then generate a NEW token and use it for syncing.');
        } else {
            console.log('\n✅ Your token is ready! You can proceed with syncing.');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data?.error?.message || error.message);
    }
}

checkToken();
