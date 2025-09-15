#!/usr/bin/env node

/**
 * Populate Social Feed with Sample Data
 * 
 * This script populates the social media posts with sample data for testing
 */

// @ts-ignore
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:1337/api';

const samplePosts = [
  {
    data: {
      Platform: 'twitter',
      Author: 'Pattaya Explorer',
      Handle: '@pattaya_explorer',
      Content: 'Just discovered an amazing hidden beach in Pattaya! The water is crystal clear and perfect for snorkeling 🏖️ #Pattaya #Thailand #Beach #Snorkeling',
      Timestamp: new Date().toISOString(),
      Likes: 45,
      Comments: 12,
      Shares: 8,
      Location: 'Pattaya, Thailand',
      Verified: true,
      Hashtags: ['Pattaya', 'Thailand', 'Beach', 'Snorkeling'],
      URL: 'https://twitter.com/pattaya_explorer/status/1234567890',
      Category: 'Tourism',
      IsActive: true,
      Featured: true
    }
  },
  {
    data: {
      Platform: 'instagram',
      Author: 'Foodie in Pattaya',
      Handle: '@pattaya_foodie',
      Content: 'The best pad thai I\'ve ever had! This local restaurant in Pattaya serves authentic Thai cuisine that will blow your mind 🍜 #Pattaya #Food #ThaiCuisine #PadThai',
      Timestamp: new Date(Date.now() - 3600000).toISOString(),
      Likes: 89,
      Comments: 23,
      Shares: 15,
      Location: 'Pattaya, Thailand',
      Verified: false,
      Hashtags: ['Pattaya', 'Food', 'ThaiCuisine', 'PadThai'],
      URL: 'https://instagram.com/p/abc123',
      Category: 'Food',
      IsActive: true,
      Featured: false
    }
  },
  {
    data: {
      Platform: 'twitter',
      Author: 'Pattaya Nightlife',
      Handle: '@pattaya_nightlife',
      Content: 'The nightlife scene in Pattaya is absolutely incredible! From rooftop bars to beach clubs, there\'s something for everyone 🌃 #Pattaya #Nightlife #Thailand #BeachClubs',
      Timestamp: new Date(Date.now() - 7200000).toISOString(),
      Likes: 156,
      Comments: 34,
      Shares: 28,
      Location: 'Pattaya, Thailand',
      Verified: true,
      Hashtags: ['Pattaya', 'Nightlife', 'Thailand', 'BeachClubs'],
      URL: 'https://twitter.com/pattaya_nightlife/status/1234567892',
      Category: 'Nightlife',
      IsActive: true,
      Featured: true
    }
  },
  {
    data: {
      Platform: 'facebook',
      Author: 'Pattaya Cultural Center',
      Handle: '@pattaya_culture',
      Content: 'Join us for the traditional Thai dance performance this weekend! Experience the rich cultural heritage of Pattaya 🎭 #Pattaya #Culture #ThaiDance #Events',
      Timestamp: new Date(Date.now() - 10800000).toISOString(),
      Likes: 67,
      Comments: 18,
      Shares: 12,
      Location: 'Pattaya, Thailand',
      Verified: true,
      Hashtags: ['Pattaya', 'Culture', 'ThaiDance', 'Events'],
      URL: 'https://facebook.com/pattaya_culture/posts/1234567893',
      Category: 'Culture',
      IsActive: true,
      Featured: false
    }
  },
  {
    data: {
      Platform: 'instagram',
      Author: 'Pattaya Beach Resort',
      Handle: '@pattaya_beach_resort',
      Content: 'Sunset views from our beachfront resort are absolutely breathtaking! Book your stay and experience paradise 🌅 #Pattaya #Beach #Resort #Sunset #Thailand',
      Timestamp: new Date(Date.now() - 14400000).toISOString(),
      Likes: 234,
      Comments: 45,
      Shares: 67,
      Location: 'Pattaya, Thailand',
      Verified: true,
      Hashtags: ['Pattaya', 'Beach', 'Resort', 'Sunset', 'Thailand'],
      URL: 'https://instagram.com/p/def456',
      Category: 'Tourism',
      IsActive: true,
      Featured: true
    }
  },
  {
    data: {
      Platform: 'twitter',
      Author: 'Pattaya Events',
      Handle: '@pattaya_events',
      Content: 'Don\'t miss the Pattaya International Music Festival this weekend! Amazing lineup of local and international artists 🎵 #Pattaya #Music #Festival #Events',
      Timestamp: new Date(Date.now() - 18000000).toISOString(),
      Likes: 123,
      Comments: 29,
      Shares: 34,
      Location: 'Pattaya, Thailand',
      Verified: true,
      Hashtags: ['Pattaya', 'Music', 'Festival', 'Events'],
      URL: 'https://twitter.com/pattaya_events/status/1234567894',
      Category: 'Events',
      IsActive: true,
      Featured: false
    }
  },
  {
    data: {
      Platform: 'tiktok',
      Author: 'Pattaya Adventures',
      Handle: '@pattaya_adventures',
      Content: 'Epic water sports adventure in Pattaya! Jet skiing, parasailing, and more! The adrenaline rush is real 🏄‍♂️ #Pattaya #Adventure #WaterSports #Thailand',
      Timestamp: new Date(Date.now() - 21600000).toISOString(),
      Likes: 456,
      Comments: 78,
      Shares: 89,
      Location: 'Pattaya, Thailand',
      Verified: false,
      Hashtags: ['Pattaya', 'Adventure', 'WaterSports', 'Thailand'],
      URL: 'https://tiktok.com/@pattaya_adventures/video/1234567895',
      Category: 'Tourism',
      IsActive: true,
      Featured: true
    }
  },
  {
    data: {
      Platform: 'instagram',
      Author: 'Pattaya Street Food',
      Handle: '@pattaya_street_food',
      Content: 'Late night street food scene in Pattaya is incredible! From grilled seafood to fresh fruit smoothies, everything tastes amazing 🌮 #Pattaya #StreetFood #Food #Nightlife',
      Timestamp: new Date(Date.now() - 25200000).toISOString(),
      Likes: 189,
      Comments: 42,
      Shares: 56,
      Location: 'Pattaya, Thailand',
      Verified: false,
      Hashtags: ['Pattaya', 'StreetFood', 'Food', 'Nightlife'],
      URL: 'https://instagram.com/p/ghi789',
      Category: 'Food',
      IsActive: true,
      Featured: false
    }
  }
];

async function populateSocialFeed() {
  try {
    console.log('🚀 Populating social feed with sample data...\n');

    // Check if posts already exist
    const existingResponse = await fetch(`${API_BASE}/social-media-posts`);
    /** @type {any} */
    const existing = await existingResponse.json();
    
    if (existing.data && existing.data.length > 0) {
      console.log(`✅ Social posts already exist (${existing.data.length} found)`);
      existing.data.forEach(post => {
        console.log(`   - ${post.Author} (${post.Platform}): ${post.Content.substring(0, 50)}...`);
      });
      return;
    }

    // Create each post
    for (const post of samplePosts) {
      try {
        const response = await fetch(`${API_BASE}/social-media-posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(post)
        });

        if (response.ok) {
          /** @type {any} */
          const result = await response.json();
          console.log(`✅ Created: ${result.data.Author} (${result.data.Platform})`);
        } else {
          /** @type {any} */
          const error = await response.json();
          console.log(`❌ Failed to create ${post.data.Author}: ${error.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`❌ Error creating ${post.data.Author}: ${error.message}`);
      }
    }

    console.log('\n🎉 Social feed population completed!');
    
    // Verify creation
    const verifyResponse = await fetch(`${API_BASE}/social-media-posts`);
    /** @type {any} */
    const verify = await verifyResponse.json();
    
    if (verify.data && verify.data.length > 0) {
      console.log(`\n📊 Summary: ${verify.data.length} social posts created`);
      
      const platforms = {};
      const categories = {};
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      
      verify.data.forEach(post => {
        platforms[post.Platform] = (platforms[post.Platform] || 0) + 1;
        if (post.Category) {
          categories[post.Category] = (categories[post.Category] || 0) + 1;
        }
        totalLikes += post.Likes || 0;
        totalComments += post.Comments || 0;
        totalShares += post.Shares || 0;
      });
      
      console.log(`   - Platforms: ${Object.entries(platforms).map(([p, c]) => `${p}(${c})`).join(', ')}`);
      console.log(`   - Categories: ${Object.entries(categories).map(([c, count]) => `${c}(${count})`).join(', ')}`);
      console.log(`   - Total Engagement: ${totalLikes} likes, ${totalComments} comments, ${totalShares} shares`);
    }
    
  } catch (error) {
    console.error('❌ Error populating social feed:', error.message);
  }
}

// Run the population
populateSocialFeed();
