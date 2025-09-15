const AviationStackService = require('./aviationstack-service');
const axios = require('axios');

class FlightDataScheduler {
  constructor() {
    this.aviationService = new AviationStackService();
    this.strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
    this.airports = ['BKK', 'DMK', 'UTP'];
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the flight data scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Flight data scheduler is already running');
      return;
    }

    console.log('🚀 Starting flight data scheduler...');
    console.log(`📡 Updating flight data every ${this.updateInterval / 1000 / 60} minutes`);
    
    this.isRunning = true;
    
    // Initial sync
    this.syncAllAirports();
    
    // Schedule regular updates
    this.intervalId = setInterval(() => {
      this.syncAllAirports();
    }, this.updateInterval);
  }

  /**
   * Stop the flight data scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Flight data scheduler is not running');
      return;
    }

    console.log('🛑 Stopping flight data scheduler...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('✅ Flight data scheduler stopped');
  }

  /**
   * Sync flight data for all airports
   */
  async syncAllAirports() {
    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Starting flight data sync...`);
    
    const results = {
      success: 0,
      failed: 0,
      totalFlights: 0
    };

    for (const airport of this.airports) {
      try {
        console.log(`📡 Syncing ${airport}...`);
        const result = await this.syncAirportData(airport);
        
        if (result.success) {
          results.success++;
          results.totalFlights += result.totalFlights;
          console.log(`✅ ${airport}: ${result.totalFlights} flights synced`);
        } else {
          results.failed++;
          console.log(`❌ ${airport}: Sync failed - ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        console.error(`❌ ${airport}: Sync error - ${error.message}`);
      }
    }

    console.log(`\n📊 Sync Summary:`);
    console.log(`   ✅ Successful: ${results.success}/${this.airports.length} airports`);
    console.log(`   ❌ Failed: ${results.failed}/${this.airports.length} airports`);
    console.log(`   📈 Total flights: ${results.totalFlights}`);
    console.log(`   🕐 Next sync: ${new Date(Date.now() + this.updateInterval).toLocaleTimeString()}`);
  }

  /**
   * Sync flight data for a specific airport
   */
  async syncAirportData(airport) {
    try {
      // Get live flight data from AviationStack
      const flights = await this.aviationService.getFlightData(airport, 'both', 100);
      
      if (!flights || flights.length === 0) {
        return { success: true, totalFlights: 0, message: 'No flights found' };
      }

      // Sync to Strapi database
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const flightData of flights) {
        try {
          const result = await this.syncFlightToStrapi(flightData);
          if (result.created) created++;
          if (result.updated) updated++;
        } catch (error) {
          errors++;
          console.error(`Failed to sync flight ${flightData.FlightNumber}:`, error.message);
        }
      }

      return {
        success: true,
        totalFlights: flights.length,
        created,
        updated,
        errors,
        airport
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        airport
      };
    }
  }

  /**
   * Sync individual flight to Strapi
   */
  async syncFlightToStrapi(flightData) {
    try {
      // Check if flight already exists
      const response = await axios.get(`${this.strapiUrl}/api/flight-trackers`, {
        params: {
          'filters[FlightNumber][$eq]': flightData.FlightNumber,
          'filters[FlightDate][$eq]': flightData.FlightDate,
          'filters[Airport][$eq]': flightData.Airport,
          'filters[FlightType][$eq]': flightData.FlightType
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        // Update existing flight
        const existingId = response.data.data[0].id;
        await axios.put(`${this.strapiUrl}/api/flight-trackers/${existingId}`, {
          data: flightData
        });
        return { updated: true, created: false };
      } else {
        // Create new flight
        await axios.post(`${this.strapiUrl}/api/flight-trackers`, {
          data: flightData
        });
        return { created: true, updated: false };
      }
    } catch (error) {
      throw new Error(`Strapi sync failed: ${error.message}`);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.isRunning,
      updateInterval: this.updateInterval,
      airports: this.airports,
      nextUpdate: this.isRunning ? new Date(Date.now() + this.updateInterval) : null
    };
  }

  /**
   * Test AviationStack API connection
   */
  async testConnection() {
    try {
      const result = await this.aviationService.testConnection();
      console.log('🔗 AviationStack API Test:', result.success ? '✅ Connected' : '❌ Failed');
      return result;
    } catch (error) {
      console.error('❌ API connection test failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in Strapi
module.exports = FlightDataScheduler;

// If run directly, start the scheduler
if (require.main === module) {
  const scheduler = new FlightDataScheduler();
  
  // Test connection first
  scheduler.testConnection().then((result) => {
    if (result.success) {
      scheduler.start();
    } else {
      console.error('❌ Cannot start scheduler - API connection failed');
      process.exit(1);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down flight data scheduler...');
    scheduler.stop();
    process.exit(0);
  });
  
  // Keep the process alive
  console.log('📡 Flight data scheduler running. Press Ctrl+C to stop.');
}
