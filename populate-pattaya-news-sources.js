#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:1337';

// Updated news sources based on user requirements
const pattayaNewsSources = [
  // Local & National English-Language Feeds (RSS)
  {
    name: "Pattaya Mail",
    description: "Longest-running and established source for detailed local news, columns, and community events",
    sourceType: "rss_feed",
    url: "https://www.pattayamail.com",
    rssUrl: "https://www.pattayamail.com/feed",
    keyValue: "Primary local English news source for Pattaya",
    isActive: true,
    priority: 1,
    fetchInterval: 30
  },
  {
    name: "The Thaiger",
    description: "Popular with expats, provides national context for Pattaya-related stories",
    sourceType: "rss_feed",
    url: "https://thethaiger.com",
    rssUrl: "https://thethaiger.com/news/feed",
    keyValue: "National news with Pattaya focus",
    isActive: true,
    priority: 1,
    fetchInterval: 30
  },
  {
    name: "Bangkok Post",
    description: "Leading English-language newspaper in Thailand",
    sourceType: "rss_feed",
    url: "https://www.bangkokpost.com",
    rssUrl: "https://www.bangkokpost.com/rss/data/most-recent.xml",
    keyValue: "Major national English news source",
    isActive: true,
    priority: 1,
    fetchInterval: 30
  },
  {
    name: "The Nation",
    description: "Major English-language daily newspaper",
    sourceType: "rss_feed",
    url: "https://www.nationthailand.com",
    rssUrl: "https://www.nationthailand.com/rss",
    keyValue: "National English news coverage",
    isActive: true,
    priority: 1,
    fetchInterval: 30
  },
  {
    name: "Thai PBS World",
    description: "International news from Thailand",
    sourceType: "rss_feed",
    url: "https://www.thaipbsworld.com",
    rssUrl: "https://www.thaipbsworld.com/feed/",
    keyValue: "International perspective on Thailand news",
    isActive: true,
    priority: 2,
    fetchInterval: 60
  },
  {
    name: "Khaosod English",
    description: "English news from Khaosod newspaper",
    sourceType: "rss_feed",
    url: "https://www.khaosodenglish.com",
    rssUrl: "https://www.khaosodenglish.com/feed/",
    keyValue: "Alternative English news source",
    isActive: true,
    priority: 2,
    fetchInterval: 60
  },
  {
    name: "The Pattaya News",
    description: "Very strong focus on up-to-the-minute breaking news, crime, and tourism-related stories",
    sourceType: "rss_feed",
    url: "https://thepattayanews.com",
    rssUrl: "https://thepattayanews.com/feed/",
    keyValue: "Fastest English source for breaking Pattaya news",
    isActive: true,
    priority: 1,
    fetchInterval: 15
  },
  {
    name: "The Thaiger Pattaya",
    description: "Pattaya-specific section of The Thaiger",
    sourceType: "rss_feed",
    url: "https://thethaiger.com/news/pattaya",
    rssUrl: "https://thethaiger.com/news/pattaya/feed",
    keyValue: "Dedicated Pattaya news from national source",
    isActive: true,
    priority: 1,
    fetchInterval: 30
  },
  // Community & Lifestyle Sources
  {
    name: "ASEAN NOW Pattaya Forum",
    description: "Major hub for expats to discuss and share news articles from various sources",
    sourceType: "rss_feed",
    url: "https://www.aseannow.com/forum/discover/8.xml/",
    rssUrl: "https://www.aseannow.com/forum/discover/8.xml/",
    keyValue: "Expat community news discussions",
    isActive: true,
    priority: 3,
    fetchInterval: 120
  },
  {
    name: "Pattaya People",
    description: "Local newspaper and TV channel focused on lifestyle, events, and positive community news",
    sourceType: "website_scraper",
    url: "http://pattayapeople.com/",
    keyValue: "Lifestyle and community news",
    isActive: true,
    priority: 3,
    fetchInterval: 120
  },
  // Official Government Sources (Facebook Pages - would need API integration)
  {
    name: "PR Pattaya (Official City Hall)",
    description: "Official public relations channel for Pattaya City Hall - most reliable source for official city news",
    sourceType: "facebook_page",
    url: "https://www.facebook.com/PRPattayacity",
    keyValue: "Official city announcements and news",
    isActive: false, // Disabled until Facebook API integration
    priority: 1,
    fetchInterval: 60
  },
  {
    name: "Chonburi Provincial PR Office",
    description: "Official news and announcements for the entire Chonburi province",
    sourceType: "facebook_page",
    url: "https://www.facebook.com/PR.Chonburi",
    keyValue: "Provincial government announcements",
    isActive: false, // Disabled until Facebook API integration
    priority: 2,
    fetchInterval: 120
  }
];

class PattayaNewsSourcePopulator {
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

  async deleteNewsSource(id, name) {
    try {
      const response = await axios.delete(`${this.apiUrl}/${id}`, { timeout: 10000 });
      console.log(`🗑️  Deleted: ${name}`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to delete ${name}: ${error.response?.data?.error?.message || error.message}`);
      return false;
    }
  }

  async populateSources() {
    console.log(`🚀 Starting Pattaya news source population for ${this.baseUrl}...\n`);

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
    let deletedCount = 0;

    // First, clean up old sources that are not in our new list
    const newSourceNames = pattayaNewsSources.map(s => s.name);
    const sourcesToDelete = existingSources.filter(s => !newSourceNames.includes(s.name));
    
    if (sourcesToDelete.length > 0) {
      console.log(`🧹 Cleaning up ${sourcesToDelete.length} old news sources...`);
      for (const source of sourcesToDelete) {
        const deleted = await this.deleteNewsSource(source.id, source.name);
        if (deleted) deletedCount++;
      }
      console.log('');
    }

    // Process new sources
    for (const source of pattayaNewsSources) {
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
    console.log(`   🗑️  Deleted: ${deletedCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total processed: ${pattayaNewsSources.length}`);

    // Show active sources
    const activeSources = pattayaNewsSources.filter(s => s.isActive);
    const inactiveSources = pattayaNewsSources.filter(s => !s.isActive);
    
    console.log(`\n📡 Active Sources (${activeSources.length}):`);
    activeSources.forEach(source => {
      console.log(`   • ${source.name} (${source.sourceType}) - Priority ${source.priority}`);
    });

    if (inactiveSources.length > 0) {
      console.log(`\n⏸️  Inactive Sources (${inactiveSources.length}):`);
      inactiveSources.forEach(source => {
        console.log(`   • ${source.name} (${source.sourceType}) - ${source.keyValue}`);
      });
    }

    return true;
  }
}

async function main() {
  console.log('🎯 Pattaya News Source Population Tool\n');
  console.log('📋 This will populate the following news sources:');
  console.log('   • Local & National English-Language RSS Feeds');
  console.log('   • Community & Lifestyle Sources');
  console.log('   • Official Government Sources (when available)\n');

  const populator = new PattayaNewsSourcePopulator(API_BASE_URL);
  const success = await populator.populateSources();

  if (success) {
    console.log('\n🎉 Pattaya news source population completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start the news scheduler to begin fetching articles');
    console.log('   2. Check the admin panel to verify sources are active');
    console.log('   3. Monitor the news articles API for new content');
  } else {
    console.log('\n❌ Population failed. Please check the server connection and try again.');
  }
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
