#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:1337';
const LOCAL_BASE_URL = 'http://localhost:1337';

// Common news sources for Pattaya/Thailand
const newsSources = [
  {
    name: "Pattaya Mail",
    description: "Leading English-language newspaper in Pattaya",
    sourceType: "rss_feed",
    url: "http://www.pattayamail.com/rss.xml",
    isActive: true,
    priority: 1,
    fetchInterval: 5,
  },
  {
    name: "The Nation Thailand",
    description: "Major English-language daily newspaper",
    sourceType: "rss_feed", 
    url: "https://www.nationthailand.com/rss.xml",
    isActive: true,
    priority: 1,
    fetchInterval: 300,
  },
  {
    name: "Bangkok Post",
    description: "Leading English-language newspaper in Thailand",
    sourceType: "rss_feed",
    url: "https://www.bangkokpost.com/rss/data/topstories.xml",
    isActive: true,
    priority: 1,
    fetchInterval: 300,
  },
  {
    name: "Thai PBS World",
    description: "International news from Thailand",
    sourceType: "rss_feed",
    url: "https://www.thaipbsworld.com/rss/",
    isActive: true,
    priority: 2,
    fetchInterval: 600,
  },
  {
    name: "Pattaya One",
    description: "Local Pattaya news and events",
    sourceType: "rss_feed",
    url: "https://pattayaone.net/feed/",
    isActive: true,
    priority: 2,
    fetchInterval: 600,
  },
  {
    name: "Pattaya Today",
    description: "Local Pattaya news website",
    sourceType: "rss_feed",
    url: "https://www.pattayatoday.net/feed/",
    isActive: true,
    priority: 3,
    fetchInterval: 900,
  },
  {
    name: "Chonburi News",
    description: "Chonburi province news (includes Pattaya)",
    sourceType: "rss_feed",
    url: "https://www.chonburinews.com/feed/",
    isActive: true,
    priority: 3,
    fetchInterval: 900,
  },
  {
    name: "Thailand News",
    description: "General Thailand news aggregator",
    sourceType: "rss_feed",
    url: "https://www.thailandnews.net/feed/",
    isActive: true,
    priority: 4,
    fetchInterval: 1200,
  },
  {
    name: "Pattaya News",
    description: "Local Pattaya news and updates",
    sourceType: "rss_feed",
    url: "https://www.pattayanews.net/feed/",
    isActive: true,
    priority: 4,
    fetchInterval: 1200,
  },
  {
    name: "Thai Visa News",
    description: "Thailand visa and expat news",
    sourceType: "rss_feed",
    url: "https://www.thaivisa.com/forum/forum/1-thailand-news/feed/",
    isActive: true,
    priority: 5,
    fetchInterval: 1800,
  }
];

class NewsSourcePopulator {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.apiUrl = `${baseUrl}/api/news-sources`;
  }

  async testConnection() {
    try {
      console.log(`🔍 Testing connection to ${this.baseUrl}...`);
      const response = await axios.get(`${this.baseUrl}/api/news-sources`, { timeout: 10000 });
      console.log(`✅ Connection successful to ${this.baseUrl}`);
      return true;
    } catch (error) {
      console.log(`❌ Connection failed to ${this.baseUrl}: ${error.message}`);
      return false;
    }
  }

  async getExistingSources() {
    try {
      const response = await axios.get(this.apiUrl, { timeout: 10000 });
      return response.data.data || [];
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`⚠️  News sources endpoint not found at ${this.apiUrl}`);
        return [];
      }
      throw error;
    }
  }

  async createNewsSource(sourceData) {
    try {
      const response = await axios.post(this.apiUrl, {
        data: sourceData
      }, { timeout: 10000 });
      
      console.log(`✅ Created: ${sourceData.name}`);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.error?.details?.name?.includes('already exists')) {
        console.log(`⚠️  Already exists: ${sourceData.name}`);
        return null;
      }
      console.log(`❌ Failed to create ${sourceData.name}: ${error.response?.data?.error?.message || error.message}`);
      return null;
    }
  }

  async updateNewsSource(id, sourceData) {
    try {
      const response = await axios.put(`${this.apiUrl}/${id}`, {
        data: sourceData
      }, { timeout: 10000 });
      
      console.log(`✅ Updated: ${sourceData.name}`);
      return response.data.data;
    } catch (error) {
      console.log(`❌ Failed to update ${sourceData.name}: ${error.response?.data?.error?.message || error.message}`);
      return null;
    }
  }

  async populateSources() {
    console.log(`🚀 Starting news source population for ${this.baseUrl}...\n`);

    // Test connection first
    const isConnected = await this.testConnection();
    if (!isConnected) {
      console.log(`❌ Cannot connect to ${this.baseUrl}. Please check if the server is running.`);
      return false;
    }

    // Get existing sources
    const existingSources = await this.getExistingSources();
    console.log(`📊 Found ${existingSources.length} existing news sources\n`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const source of newsSources) {
      const existing = existingSources.find(s => s.name === source.name);
      
      if (existing) {
        // Update existing source
        const updated = await this.updateNewsSource(existing.id, source);
        if (updated) updatedCount++;
        else skippedCount++;
      } else {
        // Create new source
        const created = await this.createNewsSource(source);
        if (created) createdCount++;
        else skippedCount++;
      }
    }

    console.log(`\n📈 Population Summary:`);
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   🔄 Updated: ${updatedCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total processed: ${newsSources.length}`);

    return true;
  }
}

async function main() {
  console.log('🎯 News Source Population Tool\n');

  // Try production API first
  const productionPopulator = new NewsSourcePopulator(API_BASE_URL);
  const productionSuccess = await productionPopulator.populateSources();

  if (!productionSuccess) {
    console.log('\n🔄 Trying local server as fallback...\n');
    const localPopulator = new NewsSourcePopulator(LOCAL_BASE_URL);
    await localPopulator.populateSources();
  }

  console.log('\n🎉 News source population completed!');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Operation cancelled by user');
  process.exit(0);
});

main().catch(console.error);
