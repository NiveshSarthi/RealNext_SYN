const axios = require('axios');

async function testLeadsAPI() {
    try {
        // You'll need to replace this with a valid token from your login
        const token = 'YOUR_JWT_TOKEN_HERE';

        console.log('🧪 Testing Internal Leads API...\n');

        // Test 1: Get internal leads
        console.log('1️⃣ Testing GET /api/leads');
        const response = await axios.get('http://localhost:5000/api/leads', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                limit: 10
            }
        });

        console.log('✅ Status:', response.status);
        console.log('📊 Response structure:', {
            success: response.data.success,
            dataCount: response.data.data?.length || 0,
            total: response.data.total,
            page: response.data.page
        });

        if (response.data.data && response.data.data.length > 0) {
            console.log('\n📋 Sample lead:');
            const sampleLead = response.data.data[0];
            console.log({
                id: sampleLead.id,
                name: sampleLead.name,
                email: sampleLead.email,
                phone: sampleLead.phone,
                source: sampleLead.source,
                status: sampleLead.status,
                created_at: sampleLead.created_at
            });
        } else {
            console.log('\n⚠️ No leads found in database');
            console.log('💡 This is expected if you haven\'t connected Facebook or created any manual leads yet');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        console.error('\n💡 Make sure to:');
        console.error('   1. Replace YOUR_JWT_TOKEN_HERE with a valid token');
        console.error('   2. Ensure backend server is running on port 5000');
        console.error('   3. Check that you have tenant access');
    }
}

testLeadsAPI();
