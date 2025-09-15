#!/usr/bin/env node

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
  }
];

async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error for ${url}:`, error.message);
    throw error;
  }
}

async function populateNewsSources() {
  console.log('🎯 Populating Pattaya News Sources...\n');

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const source of pattayaNewsSources) {
    try {
      // Check if source already exists
      const existingResponse = await fetchAPI(`${API_BASE_URL}/api/news-sources?filters[name][$eq]=${encodeURIComponent(source.name)}`);
      const existingSources = existingResponse.data || [];

      if (existingSources.length > 0) {
        // Update existing source
        const existing = existingSources[0];
        await fetchAPI(`${API_BASE_URL}/api/news-sources/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ data: source })
        });
        console.log(`✅ Updated: ${source.name}`);
        updatedCount++;
      } else {
        // Create new source
        await fetchAPI(`${API_BASE_URL}/api/news-sources`, {
          method: 'POST',
          body: JSON.stringify({ data: source })
        });
        console.log(`✅ Created: ${source.name}`);
        createdCount++;
      }
    } catch (error) {
      console.log(`❌ Failed to process ${source.name}: ${error.message}`);
      skippedCount++;
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   ✅ Created: ${createdCount}`);
  console.log(`   🔄 Updated: ${updatedCount}`);
  console.log(`   ⚠️  Skipped: ${skippedCount}`);
  console.log(`   📊 Total: ${pattayaNewsSources.length}`);
}

populateNewsSources().catch(console.error);

