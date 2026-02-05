require('dotenv').config();
const { sequelize } = require('../config/database');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function checkUser() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const users = await User.findAll();
        console.log('--- Available Users ---');
        users.forEach(u => console.log(`- ${u.email} (Status: ${u.status})`));
        console.log('-----------------------');

        const email = 'tenant-admin@testcompany.com';
        const password = 'Test123!';

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            process.exit(0);
        }

        console.log(`✅ User found: ID=${user.id}, Status=${user.status}`);
        console.log(`   Stored Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`Password '${password}' match result: ${isMatch}`);

        if (isMatch) {
            console.log('✅ Password Match: SUCCESS');
        } else {
            console.log('❌ Password Match: FAILED');
            const newHash = await bcrypt.hash(password, 10);
            console.log(`   Expected Hash Format: ${newHash.substring(0, 20)}...`);

            // Auto-fix password if mismatch
            console.log('   --- Attempting Auto-Fix Password ---');
            await user.update({ password_hash: newHash });
            console.log('   ✅ Password updated to known value.');
        }

        console.log('✅ User and Password verified manually. Now testing AuthService.login()...');

        const authService = require('../services/authService');
        const jwt = require('jsonwebtoken');
        const mockReq = {
            ip: '127.0.0.1',
            get: (header) => 'Mock-User-Agent'
        };

        try {
            const result = await authService.login(email, password, mockReq);
            console.log('✅ AuthService.login() SUCCESS');

            if (result.token || result.accessToken) {
                const token = result.token || result.accessToken;
                const decoded = jwt.decode(token);
                console.log('\n--- JWT Token Payload ---');
                console.log(JSON.stringify(decoded, null, 2));

                if (!decoded.tenant_id) {
                    console.log('❌ CRITICAL: Token is MISSING tenant_id!');
                } else {
                    console.log(`✅ Token contains tenant_id: ${decoded.tenant_id}`);
                }
            } else {
                console.log('❌ No token returned in login result');
            }

        } catch (serviceError) {
            console.error('❌ AuthService.login() FAILED:', serviceError);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkUser();
