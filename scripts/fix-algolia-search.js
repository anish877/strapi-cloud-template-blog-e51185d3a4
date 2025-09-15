const OptimizedAlgoliaService = require('./optimized-algolia-service');
const axios = require('axios');
require('dotenv').config();

async function fixAlgoliaFlightSearch() {
  console.log('🔧 Fixing Algolia Flight Search...\n');
  
  try {
    const algoliaService = new OptimizedAlgoliaService();
    
    // Clear and reconfigure index
    console.log('1️⃣ Clearing and reconfiguring index...');
    await algoliaService.unifiedIndex.clearObjects();
    await algoliaService.configureIndex();
    
    // Fetch flight data
    console.log('2️⃣ Fetching flight data...');
    const response = await axios.get('http://localhost:1337/api/flight-trackers');
    const flights = response.data.data;
    
    console.log(`Found ${flights.length} flights to index`);
    
    // Index flights with proper structure
    const flightObjects = flights.map(flight => ({
      objectID: `flight-tracker-${flight.id}`,
      id: flight.id,
      type: 'flight-tracker',
      title: `${flight.FlightNumber} - ${flight.Airline}`,
      content: `Flight ${flight.FlightNumber} operated by ${flight.Airline} from ${flight.OriginAirport} to ${flight.DestinationAirport}`,
      flightNumber: flight.FlightNumber,
      airline: flight.Airline,
      flightStatus: flight.FlightStatus,
      flightType: flight.FlightType,
      airport: flight.Airport,
      airportName: flight.AirportName,
      originAirport: flight.OriginAirport,
      destinationAirport: flight.DestinationAirport,
      terminal: flight.Terminal,
      gate: flight.Gate,
      scheduledTime: flight.ScheduledTime,
      flightDate: flight.FlightDate,
      createdAt: flight.createdAt
    }));
    
    console.log('3️⃣ Indexing flights...');
    await algoliaService.unifiedIndex.saveObjects(flightObjects);
    
    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test searches
    console.log('4️⃣ Testing searches...');
    const queries = ['TG101', 'Thai Airways', 'BKK', 'flight'];
    
    for (const query of queries) {
      const results = await algoliaService.unifiedIndex.search(query);
      console.log(`Search "${query}": ${results.nbHits} results`);
      
      if (results.hits.length > 0) {
        results.hits.forEach(hit => {
          console.log(`  - ${hit.flightNumber} (${hit.airline})`);
        });
      }
    }
    
    console.log('\n✅ Algolia Flight Search Fixed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

if (require.main === module) {
  fixAlgoliaFlightSearch();
}

module.exports = fixAlgoliaFlightSearch;
