// Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:5062/api';
const CREDENTIALS = {
    email: 'admin@testcompany.com',
    password: 'Test123!'
};

async function runVerification() {
    console.log('Starting Backend Verification...');

    // 1. Login
    console.log('\n[1] Logging in...');
    let token;
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(CREDENTIALS)
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        token = loginData.token;
        console.log('✅ Login successful. Token received.');
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Create Flow
    console.log('\n[2] Creating Flow...');
    let flowId;
    try {
        const createRes = await fetch(`${BASE_URL}/flows`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                name: 'Test Verification Flow',
                description: 'Created by verification script'
            })
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Create failed: ${createRes.status} - ${err}`);
        }

        const createData = await createRes.json();
        flowId = createData.flow_id;
        console.log(`✅ Flow created. ID: ${flowId}`);
    } catch (error) {
        console.error('❌ Create Flow failed:', error.message);
        return;
    }

    // 3. List Flows
    console.log('\n[3] Listing Flows...');
    try {
        const listRes = await fetch(`${BASE_URL}/flows`, {
            method: 'GET',
            headers: headers
        });

        if (!listRes.ok) throw new Error(`List failed: ${listRes.statusText}`);

        const listData = await listRes.json();
        const found = listData.find(f => f.id === flowId);
        if (found) {
            console.log(`✅ Flow found in list: ${found.name}`);
        } else {
            console.error('❌ Created flow NOT found in list.');
        }
    } catch (error) {
        console.error('❌ List Flows failed:', error.message);
    }

    // 4. Update Flow
    console.log('\n[4] Updating Flow...');
    try {
        const updateRes = await fetch(`${BASE_URL}/flows/${flowId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                name: 'Updated Flow Name',
                Message_Blocks: [{ id: 'node1', type: 'message' }]
            })
        });

        if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.statusText}`);

        console.log('✅ Flow updated successfully.');
    } catch (error) {
        console.error('❌ Update Flow failed:', error.message);
    }

    // 5. Get Single Flow
    console.log('\n[5] Getting Single Flow...');
    try {
        const getRes = await fetch(`${BASE_URL}/flows/${flowId}`, {
            method: 'GET',
            headers: headers
        });

        if (!getRes.ok) throw new Error(`Get failed: ${getRes.statusText}`);

        const flowData = await getRes.json();
        if (flowData.meta.name === 'Updated Flow Name') {
            console.log('✅ Fetched flow has updated name.');
        } else {
            console.error('❌ Fetched flow name does not match update.');
        }
        if (flowData.data[0].Message_Blocks.length === 1) {
            console.log('✅ Fetched flow has updated blocks.');
        } else {
            console.error('❌ Fetched flow blocks do not match update.');
        }

    } catch (error) {
        console.error('❌ Get Flow failed:', error.message);
    }

    // 6. Delete Flow
    console.log('\n[6] Deleting Flow...');
    try {
        const deleteRes = await fetch(`${BASE_URL}/flows/${flowId}`, {
            method: 'DELETE',
            headers: headers
        });

        if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.statusText}`);

        console.log('✅ Flow deleted successfully.');
    } catch (error) {
        console.error('❌ Delete Flow failed:', error.message);
    }

    console.log('\nBackend Verification Complete.');
}

runVerification();
