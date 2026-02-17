const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Lead = require('../models/Lead');

// Flexible field extraction function
function extractLeadFields(fieldData) {
  const extracted = {
    name: null,
    email: null,
    phone: null,
    location: null,
    budget: null
  };

  if (!fieldData || !Array.isArray(fieldData)) {
    return extracted;
  }

  // Define field patterns (case-insensitive, partial matches)
  const patterns = {
    name: [
      /^full\s*name$/i,
      /^name$/i,
      /^first\s*name$/i,
      /^last\s*name$/i,
      /name/i  // Fallback - any field containing "name"
    ],
    email: [
      /^email$/i,
      /^e-mail$/i,
      /^email\s*address$/i,
      /email/i  // Fallback
    ],
    phone: [
      /^phone$/i,
      /^phone\s*number$/i,
      /^mobile$/i,
      /^contact\s*number$/i,
      /^telephone$/i,
      /phone/i,  // Fallback
      /mobile/i,
      /contact/i
    ],
    location: [
      /^location$/i,
      /^city$/i,
      /^address$/i,
      /^state$/i,
      /^area$/i,
      /location/i,  // Fallback
      /city/i,
      /address/i
    ],
    budget: [
      /budget/i,
      /price/i,
      /cost/i,
      /range/i,
      /investment/i
    ]
  };

  // Process each field
  fieldData.forEach(field => {
    const fieldName = field.name?.toLowerCase()?.trim();
    const fieldValue = field.values?.[0]?.trim();

    if (!fieldName || !fieldValue) return;

    // Check each field type
    Object.keys(patterns).forEach(fieldType => {
      if (extracted[fieldType]) return; // Already found

      // Check if field name matches any pattern for this type
      const matches = patterns[fieldType].some(pattern => pattern.test(fieldName));

      if (matches) {
        extracted[fieldType] = fieldValue;
        console.log(`✅ Matched ${fieldType}: "${field.name}" -> "${fieldValue}"`);
      }
    });
  });

  // Log what we found
  console.log('📋 Extracted fields:', extracted);

  return extracted;
}

// Test the function with existing leads
async function testFieldExtraction() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a few leads with field_data
    const leadsWithData = await Lead.find({
      'metadata.field_data': { $exists: true, $ne: [] }
    }).limit(5);

    console.log(`\n🧪 Testing field extraction on ${leadsWithData.length} leads:\n`);

    leadsWithData.forEach((lead, index) => {
      console.log(`--- Lead ${index + 1}: ${lead.name} ---`);
      const extracted = extractLeadFields(lead.metadata.field_data);

      console.log(`Current DB values: Name="${lead.name}", Email="${lead.email}", Phone="${lead.phone}"`);
      console.log(`Extracted values: Name="${extracted.name}", Email="${extracted.email}", Phone="${extracted.phone}"`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Export for use in other scripts
module.exports = { extractLeadFields };

if (require.main === module) {
  testFieldExtraction();
}