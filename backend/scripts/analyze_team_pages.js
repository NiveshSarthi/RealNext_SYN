const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { FacebookPageConnection, FacebookLeadForm, Lead, Client, ClientUser } = require('../models');

async function analyzeTeamPages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all page connections with populated client info
    const pageConnections = await FacebookPageConnection.find({})
      .populate('client_id', 'name slug email')
      .sort({ client_id: 1, page_name: 1 });

    console.log('📊 TEAM PAGES ANALYSIS');
    console.log('='.repeat(80));

    // Group pages by client
    const clientPages = {};
    for (const page of pageConnections) {
      const clientId = page.client_id._id.toString();
      if (!clientPages[clientId]) {
        clientPages[clientId] = {
          client: page.client_id,
          pages: [],
          totalPages: 0,
          activePages: 0,
          totalForms: 0,
          totalLeads: 0
        };
      }
      clientPages[clientId].pages.push(page);
      clientPages[clientId].totalPages++;
      if (page.status === 'active') {
        clientPages[clientId].activePages++;
      }
    }

    // Analyze each client's pages
    let totalClients = 0;
    let totalPages = 0;
    let totalActivePages = 0;
    let totalForms = 0;
    let totalLeads = 0;

    for (const [clientId, clientData] of Object.entries(clientPages)) {
      totalClients++;
      console.log(`\n🏢 CLIENT: ${clientData.client.name} (${clientData.client.slug})`);
      console.log(`   Email: ${clientData.client.email}`);
      console.log(`   Pages: ${clientData.totalPages} total, ${clientData.activePages} active`);

      totalPages += clientData.totalPages;
      totalActivePages += clientData.activePages;

      // Analyze each page
      for (const page of clientData.pages) {
        console.log(`\n   📄 Page: ${page.page_name}`);
        console.log(`      ID: ${page.page_id}`);
        console.log(`      Status: ${page.status}`);
        console.log(`      Sync Enabled: ${page.is_lead_sync_enabled ? '✅' : '❌'}`);
        console.log(`      Last Sync: ${page.last_sync_at || 'Never'}`);

        // Get forms for this page
        const forms = await FacebookLeadForm.find({
          page_connection_id: page._id
        });

        console.log(`      Forms: ${forms.length}`);

        let pageLeads = 0;
        for (const form of forms) {
          const leadCount = await Lead.countDocuments({
            'metadata.form_id': form.form_id,
            client_id: clientId
          });
          pageLeads += leadCount;
          console.log(`         - ${form.name}: ${leadCount} leads`);
        }

        clientData.totalForms += forms.length;
        clientData.totalLeads += pageLeads;
        totalForms += forms.length;
        totalLeads += pageLeads;

        console.log(`      Total Leads: ${pageLeads}`);
      }
    }

    // Summary statistics
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Clients: ${totalClients}`);
    console.log(`Total Pages: ${totalPages}`);
    console.log(`Active Pages: ${totalActivePages}`);
    console.log(`Inactive Pages: ${totalPages - totalActivePages}`);
    console.log(`Total Forms: ${totalForms}`);
    console.log(`Total Leads: ${totalLeads}`);

    if (totalPages > 0) {
      console.log(`\n📊 AVERAGES:`);
      console.log(`Pages per Client: ${(totalPages / totalClients).toFixed(1)}`);
      console.log(`Forms per Page: ${(totalForms / totalPages).toFixed(1)}`);
      console.log(`Leads per Page: ${(totalLeads / totalPages).toFixed(1)}`);
      console.log(`Leads per Form: ${totalForms > 0 ? (totalLeads / totalForms).toFixed(1) : 0}`);
    }

    // Status distribution
    console.log(`\n📊 PAGE STATUS DISTRIBUTION:`);
    const statusCounts = {};
    for (const page of pageConnections) {
      statusCounts[page.status] = (statusCounts[page.status] || 0) + 1;
    }
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`   ${status}: ${count} pages`);
    }

    // Sync status
    const syncEnabled = pageConnections.filter(p => p.is_lead_sync_enabled).length;
    const syncDisabled = pageConnections.filter(p => !p.is_lead_sync_enabled).length;
    console.log(`\n🔄 SYNC STATUS:`);
    console.log(`   Enabled: ${syncEnabled} pages`);
    console.log(`   Disabled: ${syncDisabled} pages`);

    console.log('\n✅ Analysis completed');

  } catch (error) {
    console.error('❌ Error analyzing team pages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the analysis
analyzeTeamPages();