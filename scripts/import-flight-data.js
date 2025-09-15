const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';

async function importFlightData() {
  try {
    console.log('🚀 Starting flight data import...');
    
    // Read sample data
    const dataPath = path.join(__dirname, '../data/sample-flight-data.json');
    const flightData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log(`📦 Found ${flightData.length} flight records to import`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const flight of flightData) {
      try {
        // Check if flight already exists
        const existingResponse = await axios.get(
          `${STRAPI_URL}/api/flight-trackers?filters[FlightNumber][$eq]=${encodeURIComponent(flight.FlightNumber)}&filters[FlightDate][$eq]=${flight.FlightDate}&filters[Airport][$eq]=${flight.Airport}`
        );
        
        if (existingResponse.data.data.length > 0) {
          console.log(`⏭️  Skipping "${flight.FlightNumber}" - already exists`);
          skipped++;
          continue;
        }
        
        // Create the flight record
        const response = await axios.post(`${STRAPI_URL}/api/flight-trackers`, {
          data: flight
        });
        
        if (response.status === 200 || response.status === 201) {
          console.log(`✅ Imported flight: "${flight.FlightNumber}" (${flight.Airport} ${flight.FlightType})`);
          imported++;
        }
        
      } catch (error) {
        console.error(`❌ Failed to import "${flight.FlightNumber}":`, error.response?.data?.error?.message || error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${flightData.length}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importFlightData();
}

module.exports = importFlightData;
