require('dotenv').config();
const waService = require('./services/waService');
// Need to mock logger if it's used globally in waService and depends on something not initialized
const logger = require('./config/logger');

async function runTests() {
    try {
        console.log('--- Testing WFB Integrations ---');

        console.log('\n[1] Testing Super Admin Login...');
        await waService.superAdminLogin();
        console.log('Super Admin Token obtained successfully.');

        console.log('\n[2] Testing getWfbOrganizations...');
        const orgs = await waService.getWfbOrganizations();
        console.log(`Retrieved ${orgs?.length || 0} organizations.`);
        if (orgs?.length > 0) {
            console.log('First Org ID:', orgs[0]._id, '| Name:', orgs[0].name);
        }

        console.log('\n[3] Testing WA Settings...');
        try {
            // Need normal login for non-super-admin endpoints
            await waService.login();
            const settings = await waService.getWaSettings();
            console.log('WaSettings:', settings);
        } catch (e) {
            console.log('WaSettings failed (expected if no active WFB token for sub-org):', e.response?.data?.message || e.message);
        }

        console.log('\n[4] Testing Contacts...');
        try {
            const contacts = await waService.getContacts({ limit: 2 });
            console.log('Contacts Data:', contacts);
        } catch (e) {
            console.log('Contacts failed:', e.response?.data?.message || e.message);
        }

        console.log('\n[5] Testing Conversations...');
        try {
            const convos = await waService.getConversations({ limit: 2 });
            console.log('Conversations Data:', convos);

            if (convos?.data?.length > 0 || Array.isArray(convos)) {
                const list = Array.isArray(convos) ? convos : convos.data;
                if (list.length > 0) {
                    const firstConvo = list[0];
                    console.log(`\n[5b] Testing getConversationMessages for ${firstConvo._id}...`);
                    const msgs = await waService.getConversationMessages(firstConvo._id);
                    console.log(`Retrieved ${msgs?.length || 0} messages.`);
                }
            }
        } catch (e) {
            console.log('Conversations failed:', e.response?.data?.message || e.message);
        }

        console.log('\n--- Tests Complete ---');
    } catch (error) {
        console.error('\nTest failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    } finally {
        process.exit(0);
    }
}

runTests();
