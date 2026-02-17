const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Lead = require('../models/Lead');

async function checkFormLeadsByClient() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synditech');

    console.log('✅ Connected to MongoDB');

    // Count leads for "Navraj-copy-copy" form grouped by client_id
    const leadsByClient = await Lead.aggregate([
      {
        $match: {
          form_name: 'Navraj-copy-copy'
        }
      },
      {
        $group: {
          _id: '$client_id',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n📊 Leads for "Navraj-copy-copy" form by client:');
    leadsByClient.forEach(client => {
      console.log(`Client ID: ${client._id} - Leads: ${client.count}`);
    });

    const total = leadsByClient.reduce((sum, client) => sum + client.count, 0);
    console.log(`\nTotal leads across all clients: ${total}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFormLeadsByClient();