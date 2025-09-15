#!/usr/bin/env node

/**
 * Populate Videos Script
 * Quickly populate the database with more fetched videos
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:1337/api';

class VideoPopulator {
  constructor() {
    this.createdVideos = [];
    this.categories = ['Travel', 'Food', 'Nightlife', 'Culture', 'Adventure', 'Hotels', 'Entertainment', 'Sports'];
    this.topics = [
      'Pattaya Beach', 'Bangkok Street Food', 'Thai Culture', 'Island Hopping',
      'Nightlife Bangkok', 'Thai Temples', 'Adventure Sports', 'Luxury Hotels',
      'Thai Cooking', 'Scuba Diving', 'Mountain Trekking', 'Local Markets',
      'Festival Celebrations', 'Traditional Dance', 'Muay Thai', 'River Cruise'
    ];
  }

  generateVideoData(index) {
    const topic = this.topics[index % this.topics.length];
    const category = this.categories[index % this.categories.length];
    const now = new Date();
    
    // Create varied video data
    const videoTypes = [
      {
        title: `${topic} - Complete Travel Guide 2024`,
        description: `Comprehensive guide to ${topic} covering all the best spots, tips, and insider secrets for travelers.`,
        duration: 'PT8M45S',
        views: Math.floor(Math.random() * 50000) + 10000,
        likes: Math.floor(Math.random() * 2000) + 500
      },
      {
        title: `Top 10 ${topic} Experiences You Must Try`,
        description: `Discover the most amazing ${topic} experiences that will make your trip unforgettable.`,
        duration: 'PT12M30S',
        views: Math.floor(Math.random() * 75000) + 15000,
        likes: Math.floor(Math.random() * 3000) + 800
      },
      {
        title: `${topic} Hidden Gems - Local Secrets Revealed`,
        description: `Explore the hidden gems of ${topic} that only locals know about. Authentic experiences await!`,
        duration: 'PT6M15S',
        views: Math.floor(Math.random() * 30000) + 5000,
        likes: Math.floor(Math.random() * 1500) + 300
      },
      {
        title: `${topic} Budget Guide - Amazing Experiences Under $50`,
        description: `Experience the best of ${topic} without breaking the bank. Budget-friendly tips and recommendations.`,
        duration: 'PT9M20S',
        views: Math.floor(Math.random() * 40000) + 8000,
        likes: Math.floor(Math.random() * 1800) + 400
      }
    ];

    const videoType = videoTypes[index % videoTypes.length];
    const publishedDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days

    return {
      title: videoType.title,
      description: videoType.description,
      video_id: `fetched_${topic.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
      channel_id: `channel_${category.toLowerCase()}_${Math.floor(index / 4) + 1}`,
      channel_name: `${category} Explorer ${Math.floor(index / 4) + 1}`,
      videostatus: Math.random() > 0.3 ? 'active' : 'pending', // 70% active, 30% pending
      view_count: videoType.views,
      like_count: videoType.likes,
      duration: videoType.duration,
      video_published_at: publishedDate.toISOString(),
      thumbnail_url: `https://img.youtube.com/vi/${topic.toLowerCase().replace(/\s+/g, '_')}_${index}/maxresdefault.jpg`,
      category: category,
      source_keyword: topic,
      featured: Math.random() > 0.8, // 20% chance of being featured
      priority: Math.floor(Math.random() * 5) + 1,
      // Some videos are promoted
      is_promoted: Math.random() > 0.85, // 15% chance of being promoted
      promotion_cost: Math.random() > 0.85 ? (Math.random() * 200 + 50).toFixed(2) : null,
      sponsor_name: Math.random() > 0.85 ? `${category} Tourism Board` : null
    };
  }

  async populateVideos(count = 20) {
    console.log(`🎬 Populating ${count} videos...`);
    console.log('=' .repeat(40));

    // Get initial count
    const initialResponse = await axios.get(`${BASE_URL}/videos`);
    const initialCount = initialResponse.data.meta.pagination.total;
    console.log(`📊 Initial video count: ${initialCount}`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < count; i++) {
      try {
        const videoData = this.generateVideoData(i);
        
        const response = await axios.post(`${BASE_URL}/videos`, {
          data: videoData
        });

        if (response.status === 200 || response.status === 201) {
          successCount++;
          this.createdVideos.push(response.data.data);
          
          // Progress indicator
          if ((i + 1) % 5 === 0) {
            console.log(`   📹 Created ${i + 1}/${count} videos...`);
          }
        }

      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error creating video ${i + 1}: ${error.response?.data?.error?.message || error.message}`);
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final verification
    const finalResponse = await axios.get(`${BASE_URL}/videos`);
    const finalCount = finalResponse.data.meta.pagination.total;
    const actualNew = finalCount - initialCount;

    console.log('\n📊 POPULATION RESULTS:');
    console.log('=' .repeat(30));
    console.log(`Videos created: ${successCount}/${count}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Database count: ${initialCount} → ${finalCount} (+${actualNew})`);
    console.log(`Success rate: ${((successCount / count) * 100).toFixed(1)}%`);

    // Show sample of created videos
    if (this.createdVideos.length > 0) {
      console.log('\n📹 Sample Created Videos:');
      console.log('-' .repeat(40));
      
      this.createdVideos.slice(0, 5).forEach((video, index) => {
        const status = video.videostatus === 'active' ? '✅' : '⏳';
        const promoted = video.is_promoted ? '💰' : '  ';
        const featured = video.featured ? '⭐' : '  ';
        console.log(`${index + 1}. ${status}${promoted}${featured} "${video.title}"`);
        console.log(`   📂 ${video.category} | 👀 ${video.view_count.toLocaleString()} views | 👍 ${video.like_count.toLocaleString()} likes`);
      });

      if (this.createdVideos.length > 5) {
        console.log(`   ... and ${this.createdVideos.length - 5} more videos`);
      }
    }

    // Show statistics
    const activeVideos = this.createdVideos.filter(v => v.videostatus === 'active').length;
    const promotedVideos = this.createdVideos.filter(v => v.is_promoted).length;
    const featuredVideos = this.createdVideos.filter(v => v.featured).length;

    console.log('\n📈 VIDEO STATISTICS:');
    console.log('-' .repeat(25));
    console.log(`Active videos: ${activeVideos}/${successCount}`);
    console.log(`Promoted videos: ${promotedVideos}/${successCount}`);
    console.log(`Featured videos: ${featuredVideos}/${successCount}`);

    // Calculate total revenue from promoted videos
    const totalRevenue = this.createdVideos
      .filter(v => v.promotion_cost)
      .reduce((sum, v) => sum + parseFloat(v.promotion_cost), 0);
    
    if (totalRevenue > 0) {
      console.log(`💰 Total promotion revenue: $${totalRevenue.toFixed(2)}`);
    }

    console.log('\n🎉 Video population completed!');
    return {
      created: successCount,
      errors: errorCount,
      totalVideos: finalCount,
      activeVideos,
      promotedVideos,
      featuredVideos,
      totalRevenue
    };
  }

  async showVideosByCategory() {
    console.log('\n📂 VIDEOS BY CATEGORY:');
    console.log('=' .repeat(30));

    for (const category of this.categories) {
      try {
        const response = await axios.get(`${BASE_URL}/videos?filters[category][$eq]=${category}&pagination[limit]=100`);
        const count = response.data.data.length;
        const activeCount = response.data.data.filter(v => v.videostatus === 'active').length;
        
        console.log(`${category.padEnd(15)} : ${count} total (${activeCount} active)`);
      } catch (error) {
        console.log(`${category.padEnd(15)} : Error fetching`);
      }
    }
  }
}

async function main() {
  const populator = new VideoPopulator();
  
  try {
    // Populate 25 videos
    await populator.populateVideos(25);
    
    // Show breakdown by category
    await populator.showVideosByCategory();
    
    console.log('\n🚀 Ready for frontend integration!');
    console.log('📊 Use GET /api/videos to fetch all videos');
    console.log('🔍 Use filters for category, status, promoted videos');
    
  } catch (error) {
    console.error('❌ Population failed:', error.message);
  }
}

main();
