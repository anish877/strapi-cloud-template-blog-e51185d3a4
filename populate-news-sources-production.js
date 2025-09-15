#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:1337';

// Common news sources for Pattaya/Thailand
const newsSources = [
  {
    name: "Pattaya Mail",
    description: "Leading English-language newspaper in Pattaya",
    sourceType: "rss",
    url: "https://www.pattayamail.com/rss.xml",
    isActive: true,
    priority: 1,
    checkInterval: 300,
    tags: ["pattaya", "local", "english", "news"]
  },
  {
    name: "The Nation Thailand",
    description: "Major English-language daily newspaper",
    sourceType: "rss", 
    url: "https://www.nationthailand.com/rss.xml",
    isActive: true,
    priority: 1,
    checkInterval: 300,
    tags: ["thailand", "english", "national", "news"]
  },
  {
    name: "Bangkok Post",
    description: "Leading English-language newspaper in Thailand",
    sourceType: "rss",
    url: "https://www.bangkokpost.com/rss/data/topstories.xml",
    isActive: true,
    priority: 1,
    checkInterval: 300,
    tags: ["thailand", "bangkok", "english", "news"]
  },
  {
    name: "Thai PBS World",
    description: "International news from Thailand",
    sourceType: "rss",
    url: "https://www.thaipbsworld.com/rss/",
    isActive: true,
    priority: 2,
    checkInterval: 600,
    tags: ["thailand", "international", "english", "news"]
  },
  {
    name: "Pattaya One",
    description: "Local Pattaya news and events",
    sourceType: "rss",
    url: "https://pattayaone.net/feed/",
    isActive: true,
    priority: 2,
    checkInterval: 600,
    tags: ["pattaya", "local", "events", "news"]
  },
  {
    name: "Pattaya Today",
    description: "Local Pattaya news website",
    sourceType: "rss",
    url: "https://www.pattayatoday.net/feed/",
    isActive: true,
    priority: 3,
    checkInterval: 900,
    tags: ["pattaya", "local", "news"]
  },
  {
    name: "Chonburi News",
    description: "Chonburi province news (includes Pattaya)",
    sourceType: "rss",
    url: "https://www.chonburinews.com/feed/",
    isActive: true,
    priority: 3,
    checkInterval: 900,
    tags: ["chonburi", "pattaya", "provincial", "news"]
  },
  {
    name: "Thailand News",
    description: "General Thailand news aggregator",
    sourceType: "rss",
    url: "https://www.thailandnews.net/feed/",
    isActive: true,
    priority: 4,
    checkInterval: 1200,
    tags: ["thailand", "general", "news"]
  },
  {
    name: "Pattaya News",
    description: "Local Pattaya news and updates",
    sourceType: "rss",
    url: "https://www.pattayanews.net/feed/",
    isActive: true,
    priority: 4,
    checkInterval: 1200,
    tags: ["pattaya", "local", "updates", "news"]
  },
  {
    name: "Thai Visa News",
    description: "Thailand visa and expat news",
    sourceType: "rss",
    url: "https://www.thaivisa.com/forum/forum/1-thailand-news/feed/",
    isActive: true,
    priority: 5,
    checkInterval: 1800,
    tags: ["thailand", "expat", "visa", "forum", "news"]
  }
];

class NewsSourceCreator {
  constructor() {
    this.apiUrl = `${API_BASE_URL}/api/news-sources`;
  }

  async testConnection() {
    try {
      console.log(`🔍 Testing connection to ${API_BASE_URL}...`);
      const response = await axios.get(`${API_BASE_URL}/api/news-articles`, { timeout: 10000 });
      console.log(`✅ Connection successful - news-articles endpoint working`);
      return true;
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      return false;
    }
  }

  async testNewsSourcesEndpoint() {
    try {
      console.log(`🔍 Testing news-sources endpoint...`);
      const response = await axios.get(this.apiUrl, { 
        timeout: 10000,
        validateStatus: () => true // Accept all status codes
      });
      
      console.log(`   Status: ${response.status}`);
      if (response.status === 200) {
        console.log(`   ✅ news-sources endpoint is working`);
        return true;
      } else if (response.status === 404) {
        console.log(`   ❌ news-sources endpoint not found`);
        return false;
      } else {
        console.log(`   ⚠️  Unexpected status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Error testing endpoint: ${error.message}`);
      return false;
    }
  }

  async createNewsSource(sourceData) {
    try {
      console.log(`📝 Creating: ${sourceData.name}...`);
      const response = await axios.post(this.apiUrl, {
        data: sourceData
      }, { 
        timeout: 10000,
        validateStatus: () => true // Accept all status codes
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ Created successfully: ${sourceData.name}`);
        return response.data.data;
      } else {
        console.log(`   ❌ Failed to create ${sourceData.name}: Status ${response.status}`);
        if (response.data?.error) {
          console.log(`   Error: ${JSON.stringify(response.data.error)}`);
        }
        return null;
      }
    } catch (error) {
      console.log(`   ❌ Error creating ${sourceData.name}: ${error.message}`);
      return null;
    }
  }

  async populateSources() {
    console.log(`🚀 Starting news source population for ${API_BASE_URL}...\n`);

    // Test connection first
    const isConnected = await this.testConnection();
    if (!isConnected) {
      console.log(`❌ Cannot connect to ${API_BASE_URL}. Please check if the server is running.`);
      return false;
    }

    // Test news-sources endpoint
    const endpointWorks = await this.testNewsSourcesEndpoint();
    if (!endpointWorks) {
      console.log(`\n❌ News sources endpoint is not available. This could mean:`);
      console.log(`   1. The news-source content type is not deployed`);
      console.log(`   2. The API routes are not configured`);
      console.log(`   3. The content type needs to be published in admin panel`);
      console.log(`\n💡 Solutions:`);
      console.log(`   1. Check the admin panel at ${API_BASE_URL}/admin`);
      console.log(`   2. Go to Content Manager and publish the news-source content type`);
      console.log(`   3. Redeploy the application with the updated API routes`);
      return false;
    }

    let createdCount = 0;
    let failedCount = 0;

    console.log(`\n📡 Creating ${newsSources.length} news sources...\n`);

    for (const source of newsSources) {
      const created = await this.createNewsSource(source);
      if (created) {
        createdCount++;
      } else {
        failedCount++;
      }
    }

    console.log(`\n📈 Population Summary:`);
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📊 Total processed: ${newsSources.length}`);

    if (createdCount > 0) {
      console.log(`\n🎉 Successfully created ${createdCount} news sources!`);
      console.log(`📡 News sources are now ready to be used by the news scheduler.`);
    }

    return createdCount > 0;
  }
}

async function main() {
  console.log('🎯 News Source Population Tool for Production\n');

  const creator = new NewsSourceCreator();
  const success = await creator.populateSources();

  if (!success) {
    console.log('\n❌ News source population failed. Please check the issues above.');
    process.exit(1);
  }

  console.log('\n✅ News source population completed successfully!');
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
