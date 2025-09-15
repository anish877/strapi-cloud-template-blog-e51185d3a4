#!/usr/bin/env node

/**
 * Alternative Video Scheduler
 * Standalone video fetching system that bypasses Strapi's cron limitations
 * Based on the successful news system alternative scheduler approach
 */

const axios = require('axios');

class AlternativeVideoScheduler {
  constructor() {
    this.baseURL = 'http://localhost:1337/api';
    this.isRunning = false;
    this.cycleCount = 0;
    this.lastFetchTime = null;
    this.errors = [];
    this.successfulFetches = 0;
    
    // Category mapping: trending-topics → video schema
    this.categoryMapping = {
      'Tourism': 'Travel',
      'Food': 'Food',
      'Nightlife': 'Nightlife', 
      'Culture': 'Culture',
      'Events': 'Events',
      'Entertainment': 'Entertainment',
      'Business': 'Business',
      'Shopping': 'Business' // Map Shopping to Business for video schema
    };
    
    // Built-in trending topics - fallback when database is empty
    this.builtInTopics = [
      { Title: 'Thailand Travel', Category: 'Travel', Priority: 1, IsActive: true },
      { Title: 'Pattaya Tourism', Category: 'Travel', Priority: 1, IsActive: true },
      { Title: 'Bangkok Street Food', Category: 'Food', Priority: 2, IsActive: true },
      { Title: 'Thai Culture', Category: 'Culture', Priority: 2, IsActive: true },
      { Title: 'Island Hopping Thailand', Category: 'Adventure', Priority: 2, IsActive: true },
      { Title: 'Thai Temples', Category: 'Culture', Priority: 3, IsActive: true },
      { Title: 'Muay Thai Training', Category: 'Sports', Priority: 3, IsActive: true },
      { Title: 'Thai Cooking Classes', Category: 'Food', Priority: 3, IsActive: true },
      { Title: 'Scuba Diving Thailand', Category: 'Adventure', Priority: 2, IsActive: true },
      { Title: 'Bangkok Nightlife', Category: 'Entertainment', Priority: 3, IsActive: true }
    ];
    
    // Built-in trusted channels - fallback when database is empty
    this.builtInTrustedChannels = [
      { Platform: 'youtube', ChannelId: 'UCYfdidRxbB8Qhf0Nx7ioOYw', ChannelName: 'World Nomads', IsVerified: true },
      { Platform: 'youtube', ChannelId: 'UCMke6DOgpX-dqeTvHKD5upw', ChannelName: 'Kara and Nate', IsVerified: true },
      { Platform: 'youtube', ChannelId: 'UCu16_yDbSoaq_eKUhIZNpOg', ChannelName: 'Mark Wiens', IsVerified: true },
      { Platform: 'youtube', ChannelId: 'UCxDZs_ltFFvn0FDHT6kmoXA', ChannelName: 'Travel with Mansoureh', IsVerified: true }
    ];
    
    // Built-in content safety keywords - fallback when database is empty
    this.builtInBannedKeywords = [
      { Keyword: 'scam', MatchType: 'contains', IsActive: true },
      { Keyword: 'fake', MatchType: 'contains', IsActive: true },
      { Keyword: 'illegal', MatchType: 'contains', IsActive: true },
      { Keyword: 'dangerous', MatchType: 'contains', IsActive: true },
      { Keyword: 'adult', MatchType: 'contains', IsActive: true },
      { Keyword: 'gambling', MatchType: 'contains', IsActive: true }
    ];
  }

  /**
   * Main scheduler loop - dynamic intervals based on time of day
   */
  async start() {
    console.log('🎬 Alternative Video Scheduler Starting...');
    console.log('⏰ Dynamic fetch intervals:');
    console.log('   📅 Daytime (06:00-23:00): Every 30 minutes');
    console.log('   🌙 Nighttime (23:01-05:59): Every 2 hours');
    console.log('   🔥 Trending tags: Every 5-10 minutes');
    console.log('🔄 Bypassing Strapi cron limitations\n');

    this.isRunning = true;

    // Initial fetch
    await this.performFetch();

    // Set up dynamic scheduling
    this.scheduleNextFetch();

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down Alternative Video Scheduler...');
      this.isRunning = false;
      process.exit(0);
    });
  }

  /**
   * Schedule next fetch based on time of day and trending tags
   */
  scheduleNextFetch() {
    if (!this.isRunning) return;

    const now = new Date();
    const currentHour = now.getHours();
    let nextInterval;

    // Check for trending tags first (highest priority)
    this.checkTrendingTags().then(hasTrendingTags => {
      if (hasTrendingTags) {
        // High-frequency for trending tags: 5-10 minutes
        nextInterval = Math.floor(Math.random() * 5 + 5) * 60 * 1000; // 5-10 minutes
        console.log(`🔥 Trending tag active - next fetch in ${nextInterval/60000} minutes`);
      } else if (currentHour >= 6 && currentHour <= 23) {
        // Daytime: every 30 minutes
        nextInterval = 30 * 60 * 1000;
        console.log(`📅 Daytime schedule - next fetch in 30 minutes`);
      } else {
        // Nighttime: every 2 hours
        nextInterval = 2 * 60 * 60 * 1000;
        console.log(`🌙 Nighttime schedule - next fetch in 2 hours`);
      }

      setTimeout(async () => {
        if (this.isRunning) {
          await this.performFetch();
          this.scheduleNextFetch();
        }
      }, nextInterval);
    });
  }

  /**
   * Check for active trending tags
   */
  async checkTrendingTags() {
    try {
      const response = await axios.get(`${this.baseURL}/trending-tags-videos?filters[active][$eq]=true&filters[featured][$eq]=true`);
      const activeTags = response.data.data || [];
      
      if (activeTags.length > 0) {
        console.log(`🔥 Found ${activeTags.length} active trending tags`);
        return true;
      }
      return false;
    } catch (error) {
      console.log(`⚠️  Could not check trending tags: ${error.message}`);
      return false;
    }
  }

  /**
   * Perform video fetching cycle
   */
  async performFetch() {
    this.cycleCount++;
    const startTime = new Date();
    
    console.log(`\n🔄 Fetch Cycle #${this.cycleCount} - ${startTime.toLocaleTimeString()}`);
    console.log('=' .repeat(50));

    try {
      // Step 1: Get trending topics from content types (prioritize database over built-in)
      console.log('1️⃣ Checking trending topics from content types...');
      let activeTopics = [];
      let usingFallback = false;
      
      try {
        // Try trending tags video endpoint (primary)
        const trendingResponse = await axios.get(`${this.baseURL}/trending-tags-videos?filters[active][$eq]=true`);
        const trendingTags = trendingResponse.data.data || [];
        
        if (trendingTags.length > 0) {
          // Convert trending tags to topic format
          activeTopics = trendingTags.map(tag => ({
            Title: tag.tag,
            Category: tag.category,
            Priority: tag.priority === 'High' ? 1 : tag.priority === 'Medium' ? 2 : 3,
            IsActive: tag.active,
            Source: 'trending-tags-video'
          }));
          console.log(`   ✅ Found ${activeTopics.length} active trending tags`);
          console.log(`   📝 Tags: ${activeTopics.map(t => t.Title).join(', ')}`);
        } else {
          console.log(`   ℹ️  trending-tags-videos: empty`);
        }
      } catch (error) {
        console.log(`   ⚠️  trending-tags-videos endpoint failed: ${error.message}`);
      }
      
      // Multi-level fallback system
      if (activeTopics.length === 0) {
        console.log('   🔄 No content types found, trying manual fallbacks...');
        
        // Fallback 1: Check trusted channels for content inspiration
        try {
          const trustedResponse = await axios.get(`${this.baseURL}/trusted-channels-videos?filters[active][$eq]=true&filters[verification_status][$eq]=Verified`);
          const trustedChannels = trustedResponse.data.data || [];
          
          if (trustedChannels.length > 0) {
            console.log(`   ✅ Found ${trustedChannels.length} trusted channels, generating topics from them`);
            activeTopics = this.generateTopicsFromTrustedChannels(trustedChannels);
          }
        } catch (error) {
          console.log(`   ⚠️  Trusted channels unavailable: ${error.message}`);
        }
        
        // Fallback 2: Use built-in topics if still empty
        if (activeTopics.length === 0) {
          activeTopics = this.builtInTopics.filter(t => t.IsActive);
          usingFallback = true;
          console.log(`   🔄 Using built-in fallback topics: ${activeTopics.length}`);
          console.log(`   📝 Built-in topics: ${activeTopics.map(t => t.Title).join(', ')}`);
        }
        
        // Fallback 3: Emergency manual topics if everything fails
        if (activeTopics.length === 0) {
          activeTopics = this.getEmergencyTopics();
          console.log(`   🚨 Emergency fallback: ${activeTopics.length} manual topics`);
          console.log(`   📝 Emergency topics: ${activeTopics.map(t => t.Title).join(', ')}`);
        }
      }
      
      if (activeTopics.length === 0) {
        console.log('   ❌ No topics available - skipping fetch');
        return;
      }

      // Step 2: Get current video count
      console.log('2️⃣ Checking current video count...');
      const videosResponse = await axios.get(`${this.baseURL}/videos`);
      const currentCount = videosResponse.data.meta.pagination.total;
      console.log(`   📹 Current videos in database: ${currentCount}`);

      // Step 3: Fetch videos for each active topic
      console.log('3️⃣ Fetching videos by trending topics...');
      let totalNewVideos = 0;

      for (const topic of activeTopics.slice(0, 2)) { // Limit to 2 topics per cycle
        try {
          console.log(`   🔍 Processing: "${topic.Title}" (${topic.Category})`);
          
          // Simulate video fetching (using the video service logic)
          const newVideos = await this.fetchVideosForTopic(topic);
          totalNewVideos += newVideos;
          
          console.log(`   ✅ Added ${newVideos} videos for "${topic.Title}"`);
          
        } catch (error) {
          console.log(`   ❌ Error processing "${topic.Title}": ${error.message}`);
          this.errors.push({
            topic: topic.Title,
            error: error.message,
            time: new Date()
          });
        }
      }

      // Step 4: Verify final count
      console.log('4️⃣ Verifying results...');
      const finalResponse = await axios.get(`${this.baseURL}/videos`);
      const finalCount = finalResponse.data.meta.pagination.total;
      const actualNew = finalCount - currentCount;
      
      console.log(`   📊 Video count: ${currentCount} → ${finalCount} (+${actualNew})`);
      
      if (actualNew > 0) {
        this.successfulFetches++;
        console.log(`   🎉 Successfully added ${actualNew} videos!`);
        
        // Show latest videos
        const latestResponse = await axios.get(`${this.baseURL}/videos?sort=createdAt:desc&pagination[limit]=${actualNew}`);
        latestResponse.data.data.forEach((video, index) => {
          console.log(`      ${index + 1}. "${video.title}" (${video.videostatus})`);
        });
      } else {
        console.log(`   ℹ️  No new videos added this cycle`);
      }

      this.lastFetchTime = startTime;
      
      // Step 5: Cleanup old videos (optional)
      await this.performCleanup();

    } catch (error) {
      console.error(`❌ Fetch cycle failed: ${error.message}`);
      this.errors.push({
        cycle: this.cycleCount,
        error: error.message,
        time: startTime
      });
    }

    const duration = Date.now() - startTime.getTime();
    console.log(`⏱️  Cycle completed in ${duration}ms`);
    console.log(`📈 Stats: ${this.successfulFetches} successful fetches, ${this.errors.length} errors`);
  }

  /**
   * Fetch videos for a specific trending topic
   */
  async fetchVideosForTopic(topic) {
    try {
      // Check if YouTube API is available
      const youtubeApiKey = process.env.YOUTUBE_API_KEY;
      
      if (youtubeApiKey && youtubeApiKey !== 'your_youtube_api_key_here') {
        // Use real YouTube API if available
        return await this.fetchRealYouTubeVideos(topic, youtubeApiKey);
      } else {
        // Fallback to sample videos for testing
        console.log(`   🔧 YouTube API not configured, using sample data for "${topic.Title}"`);
        return await this.createSampleVideos(topic);
      }
    } catch (error) {
      console.log(`   ❌ Error fetching videos for "${topic.Title}": ${error.message}`);
      return 0;
    }
  }

  /**
   * Create sample videos for testing (when YouTube API is not available)
   */
  async createSampleVideos(topic) {
    try {
      const sampleVideos = [
        {
          title: `${topic.Title} - Complete Guide ${new Date().getFullYear()}`,
          description: `Comprehensive guide about ${topic.Title} in ${topic.Category}`,
          video_id: `sample_${topic.Title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_1`,
          channel_id: `channel_${topic.Category.toLowerCase()}`,
          channel_name: `${topic.Category} Explorer`,
          videostatus: 'pending',
          view_count: Math.floor(Math.random() * 10000),
          like_count: Math.floor(Math.random() * 500),
          duration: '8:45',
          thumbnail_url: `https://img.youtube.com/vi/sample_guide_${Date.now()}/maxresdefault.jpg`,
          category: this.mapCategoryForVideo(topic.Category),
          source_keyword: topic.Title
        },
        {
          title: `Best ${topic.Title} Experience Guide`,
          description: `Complete guide for ${topic.Title} experiences`,
          video_id: `sample_${topic.Title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_2`,
          channel_id: `channel_${topic.Category.toLowerCase()}_guide`,
          channel_name: `${topic.Category} Guide Channel`,
          videostatus: 'pending',
          view_count: Math.floor(Math.random() * 15000),
          like_count: Math.floor(Math.random() * 750),
          duration: 'PT8M15S',
          video_published_at: new Date().toISOString(),
          thumbnail_url: `https://img.youtube.com/vi/sample_${Date.now()}/maxresdefault.jpg`,
          category: topic.Category,
          source_keyword: topic.Title
        }
      ];

      let createdCount = 0;

      for (const videoData of sampleVideos) {
        try {
          // Apply hybrid approval logic
          const approvalStatus = await this.determineApprovalStatus(videoData.channel_id);
          videoData.videostatus = approvalStatus;
          
          const response = await axios.post(`${this.baseURL}/videos`, {
            data: videoData
          });
          
          if (response.status === 200 || response.status === 201) {
            createdCount++;
            const statusEmoji = approvalStatus === 'Approved' ? '✅' : '⏳';
            console.log(`   ${statusEmoji} Created video: "${videoData.title}" (${approvalStatus})`);
          }
        } catch (error) {
          console.log(`   ❌ Failed to create video "${videoData.title}": ${error.message}`);
        }
      }

      return createdCount;

    } catch (error) {
      console.error(`Error fetching videos for topic ${topic.Title}:`, error.message);
      return 0;
    }
  }

  /**
   * Fetch real YouTube videos using YouTube API (when API key is available)
   */
  async fetchRealYouTubeVideos(topic, apiKey) {
    try {
      console.log(`   🔍 Searching YouTube for "${topic.Title}"`);
      
      // YouTube API search endpoint
      const searchUrl = `https://www.googleapis.com/youtube/v3/search`;
      const params = {
        part: 'snippet',
        q: topic.Title,
        type: 'video',
        maxResults: 2,
        safeSearch: 'strict',
        key: apiKey,
        regionCode: 'TH', // Thailand region
        relevanceLanguage: 'en'
      };
      
      const response = await axios.get(searchUrl, { params });
      const videos = response.data.items;
      
      if (!videos || videos.length === 0) {
        console.log(`   ℹ️  No YouTube videos found for "${topic.Title}"`);
        return 0;
      }
      
      let createdCount = 0;
      
      for (const video of videos) {
        // Apply content filtering
        if (await this.isContentSafe(video, topic)) {
          // Apply content filtering
          if (await this.isContentFiltered(video.snippet.title, video.snippet.description, video.snippet.channelId)) {
            console.log(`   🚫 Filtered out: "${video.snippet.title}"`);
            continue;
          }

          const approvalStatus = await this.determineApprovalStatus(video.snippet.channelId);
          
          const videoData = {
            title: video.snippet.title,
            description: video.snippet.description,
            video_id: video.id.videoId,
            channel_id: video.snippet.channelId,
            channel_name: video.snippet.channelTitle,
            thumbnail_url: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
            videostatus: approvalStatus,
            category: this.mapCategoryForVideo(topic.Category),
            source_keyword: topic.Title,
            video_published_at: video.snippet.publishedAt
          };
          
          try {
            const createResponse = await axios.post(`${this.baseURL}/videos`, {
              data: videoData
            });
            
            if (createResponse.status === 200 || createResponse.status === 201) {
              createdCount++;
              const statusEmoji = approvalStatus === 'Approved' ? '✅' : '⏳';
              console.log(`   ${statusEmoji} Created video: "${videoData.title}" (${approvalStatus})`);
            }
          } catch (error) {
            console.log(`   ⚠️  Failed to save video: ${error.response?.data?.error?.message || error.message}`);
          }
        } else {
          console.log(`   🚫 Filtered out: "${video.snippet.title}" (content safety)`);
        }
      }
      
      return createdCount;
      
    } catch (error) {
      console.log(`   ❌ YouTube API error: ${error.message}`);
      // Fallback to sample videos if API fails
      return await this.createSampleVideos(topic);
    }
  }

  /**
   * Check if content passes safety filters (prioritize content types over built-in)
   */
  async isContentSafe(video, topic) {
    const title = video.snippet.title.toLowerCase();
    const description = video.snippet.description.toLowerCase();
    
    let bannedKeywords = [];
    
    // Step 1: Try to get banned keywords from content types
    try {
      const keywordsResponse = await axios.get(`${this.baseURL}/content-safety-keywords`);
      const contentTypeKeywords = keywordsResponse.data.data.filter(k => k.IsActive);
      
      if (contentTypeKeywords.length > 0) {
        bannedKeywords = contentTypeKeywords;
        console.log(`     🔒 Using ${contentTypeKeywords.length} content type safety keywords`);
      }
    } catch (error) {
      console.log(`     ⚠️  Content type keywords unavailable, using built-in fallback`);
    }
    
    // Step 2: Fallback to built-in keywords if content types are empty
    if (bannedKeywords.length === 0) {
      bannedKeywords = this.builtInBannedKeywords.filter(k => k.IsActive);
      console.log(`     🔄 Using ${bannedKeywords.length} built-in safety keywords`);
    }
    
    // Step 3: Check content against keywords
    for (const bannedKeyword of bannedKeywords) {
      const keyword = bannedKeyword.Keyword.toLowerCase();
      if (bannedKeyword.MatchType === 'contains') {
        if (title.includes(keyword) || description.includes(keyword)) {
          console.log(`     ❌ Content blocked by keyword: "${keyword}"`);
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Check if channel is in trusted list (prioritize content types over built-in)
   */
  async isChannelTrusted(channelId) {
    let trustedChannels = [];
    
    // Step 1: Try to get trusted channels from content types
    try {
      const channelsResponse = await axios.get(`${this.baseURL}/trusted-channels`);
      const contentTypeChannels = channelsResponse.data.data.filter(c => c.Platform === 'youtube');
      
      if (contentTypeChannels.length > 0) {
        trustedChannels = contentTypeChannels;
        console.log(`     ✅ Using ${contentTypeChannels.length} content type trusted channels`);
      }
    } catch (error) {
      console.log(`     ⚠️  Content type channels unavailable, using built-in fallback`);
    }
    
    // Step 2: Fallback to built-in channels if content types are empty
    if (trustedChannels.length === 0) {
      trustedChannels = this.builtInTrustedChannels.filter(c => c.Platform === 'youtube');
      console.log(`     🔄 Using ${trustedChannels.length} built-in trusted channels`);
    }
    
    // Step 3: Check if channel is trusted
    return trustedChannels.some(channel => channel.ChannelId === channelId);
  }

  /**
   * Cleanup old videos to maintain database size
   */
  async performCleanup() {
    try {
      console.log('🧹 Performing cleanup...');
      
      const videosResponse = await axios.get(`${this.baseURL}/videos?sort=createdAt:asc&pagination[limit]=100`);
      const totalVideos = videosResponse.data.meta.pagination.total;
      
      // Keep maximum 50 videos
      if (totalVideos > 50) {
        const excessCount = totalVideos - 50;
        const oldVideos = videosResponse.data.data.slice(0, excessCount);
        
        console.log(`   📊 Total videos: ${totalVideos}, removing ${excessCount} oldest`);
        
        let deletedCount = 0;
        for (const video of oldVideos) {
          try {
            await axios.delete(`${this.baseURL}/videos/${video.documentId}`);
            deletedCount++;
          } catch (error) {
            // Ignore deletion errors (may be due to Strapi deletion bug)
          }
        }
        
        console.log(`   🗑️  Cleanup completed: ${deletedCount} videos processed`);
      } else {
        console.log(`   ✅ No cleanup needed (${totalVideos}/50 videos)`);
      }
      
    } catch (error) {
      console.log(`   ⚠️  Cleanup error: ${error.message}`);
    }
  }

  /**
   * Map trending-topic category to video schema category
   */
  mapCategoryForVideo(trendingCategory) {
    const mappedCategory = this.categoryMapping[trendingCategory];
    if (!mappedCategory) {
      console.log(`   ⚠️  Unknown category "${trendingCategory}", defaulting to "Entertainment"`);
      return 'Entertainment';
    }
    return mappedCategory;
  }

  /**
   * Generate topics from trusted channels when content types are empty
   */
  generateTopicsFromTrustedChannels(trustedChannels) {
    const generatedTopics = [];
    
    for (const channel of trustedChannels.slice(0, 3)) { // Limit to 3 channels
      const channelName = channel.channel_name || 'Unknown';
      const channelCategory = channel.category || 'Entertainment';
      
      // Use channel's category or generate based on name patterns
      let topicCategory = channelCategory;
      if (channelName.toLowerCase().includes('travel') || channelName.toLowerCase().includes('nomad')) {
        topicCategory = 'Travel';
      } else if (channelName.toLowerCase().includes('food') || channelName.toLowerCase().includes('cooking')) {
        topicCategory = 'Food';
      }
      
      generatedTopics.push({
        Title: `${channelName} Content`,
        Category: topicCategory,
        Priority: channel.trust_level === 'High' ? 1 : 2,
        IsActive: true,
        Source: 'trusted_channel'
      });
    }
    
    return generatedTopics;
  }
  
  /**
   * Get emergency manual topics when all other methods fail
   */
  getEmergencyTopics() {
    return [
      { Title: 'Thailand', Category: 'Travel', Priority: 1, IsActive: true, Source: 'emergency' },
      { Title: 'Pattaya', Category: 'Travel', Priority: 1, IsActive: true, Source: 'emergency' },
      { Title: 'Bangkok', Category: 'Travel', Priority: 1, IsActive: true, Source: 'emergency' },
      { Title: 'Thai Food', Category: 'Food', Priority: 2, IsActive: true, Source: 'emergency' },
      { Title: 'Tourism', Category: 'Travel', Priority: 2, IsActive: true, Source: 'emergency' }
    ];
  }

  /**
   * Determine video approval status based on trusted channels
   */
  async determineApprovalStatus(channelId) {
    try {
      // Check if channel is in trusted channels list
      const trustedResponse = await axios.get(`${this.baseURL}/trusted-channels-videos?filters[channel_id][$eq]=${channelId}&filters[active][$eq]=true`);
      const trustedChannels = trustedResponse.data.data || [];
      
      if (trustedChannels.length > 0 && trustedChannels[0].verification_status === 'Verified' && trustedChannels[0].auto_approve) {
        return 'Approved';
      }
      
      return 'Pending Review';
    } catch (error) {
      console.log(`   ⚠️  Could not check trusted channels: ${error.message}`);
      return 'Pending Review'; // Default to pending if check fails
    }
  }

  /**
   * Check if content should be filtered based on banned keywords and channels
   */
  async isContentFiltered(title, description, channelId) {
    try {
      // Check banned channels
      const bannedChannelsResponse = await axios.get(`${this.baseURL}/banned-channels-videos?filters[channel_id][$eq]=${channelId}&filters[active][$eq]=true`);
      const bannedChannels = bannedChannelsResponse.data.data || [];
      
      if (bannedChannels.length > 0 && bannedChannels[0].ban_level !== 'Under Review') {
        return true; // Channel is banned
      }
      
      // Check banned keywords
      const bannedKeywordsResponse = await axios.get(`${this.baseURL}/banned-keywords-videos?filters[active][$eq]=true`);
      const bannedKeywords = bannedKeywordsResponse.data.data || this.builtInBannedKeywords;
      
      const contentText = `${title} ${description}`.toLowerCase();
      
      for (const keywordObj of bannedKeywords) {
        const keyword = keywordObj.keyword.toLowerCase();
        const matchType = keywordObj.match_type || 'Contains';
        const appliesTo = keywordObj.applies_to || 'All';
        
        // Check if keyword applies to this content type
        let textToCheck = '';
        if (appliesTo === 'Title') textToCheck = title.toLowerCase();
        else if (appliesTo === 'Description') textToCheck = description.toLowerCase();
        else textToCheck = contentText; // 'All' or other cases
        
        // Apply matching logic
        let isMatch = false;
        switch (matchType) {
          case 'Exact':
            isMatch = textToCheck === keyword;
            break;
          case 'Contains':
            isMatch = textToCheck.includes(keyword);
            break;
          case 'Starts With':
            isMatch = textToCheck.startsWith(keyword);
            break;
          case 'Ends With':
            isMatch = textToCheck.endsWith(keyword);
            break;
          default:
            isMatch = textToCheck.includes(keyword);
        }
        
        if (isMatch) {
          return true; // Content matches banned keyword
        }
      }
      
      return false; // Content is safe
    } catch (error) {
      console.log(`   ⚠️  Could not check content filtering: ${error.message}`);
      return false; // Default to safe if check fails
    }
  }

  /**
   * Display scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      lastFetchTime: this.lastFetchTime,
      successfulFetches: this.successfulFetches,
      errorCount: this.errors.length,
      uptime: this.lastFetchTime ? Date.now() - this.lastFetchTime.getTime() : 0
    };
  }
}

// Export the class for use in bootstrap
module.exports = AlternativeVideoScheduler;

// Only start scheduler if this file is run directly
if (require.main === module) {
  const scheduler = new AlternativeVideoScheduler();
  scheduler.start().catch(error => {
    console.error('❌ Failed to start Alternative Video Scheduler:', error);
    process.exit(1);
  });

  console.log('🎬 Alternative Video Scheduler is running...');
  console.log('📝 Press Ctrl+C to stop');
}
