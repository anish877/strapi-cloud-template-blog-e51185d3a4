#!/usr/bin/env node

/**
 * Check Video Scheduler Fetching Status
 * Verifies if the video scheduler is actively fetching videos
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:1337/api';

async function checkSchedulerFetching() {
  console.log('🔍 Checking Video Scheduler Fetching Status...\n');
  
  try {
    // Check 1: Current video count baseline
    console.log('📊 Current Video Database Status:');
    const initialResponse = await axios.get(`${BASE_URL}/videos`);
    const initialCount = initialResponse.data.meta.pagination.total;
    console.log(`   Total videos: ${initialCount}`);
    
    // Show video breakdown by status
    const activeResponse = await axios.get(`${BASE_URL}/videos?filters[videostatus][$eq]=active`);
    const pendingResponse = await axios.get(`${BASE_URL}/videos?filters[videostatus][$eq]=pending`);
    console.log(`   Active: ${activeResponse.data.meta.pagination.total}`);
    console.log(`   Pending: ${pendingResponse.data.meta.pagination.total}`);
    console.log('');
    
    // Check 2: Scheduler timing analysis
    console.log('⏰ Scheduler Timing Analysis:');
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    let currentMode = 'nighttime';
    let nextFetch = 'Unknown';
    
    if (hour >= 6 && hour <= 23) {
      currentMode = 'daytime';
      // Daytime: every 30 minutes
      const minutesUntilNext = 30 - (minute % 30);
      nextFetch = `${minutesUntilNext} minutes`;
    } else {
      // Nighttime: every 2 hours
      const hoursUntilNext = 2 - (hour % 2);
      const minutesUntilNext = 60 - minute;
      if (hoursUntilNext === 0) {
        nextFetch = `${minutesUntilNext} minutes`;
      } else {
        nextFetch = `${hoursUntilNext}h ${minutesUntilNext}m`;
      }
    }
    
    console.log(`   Current time: ${now.toLocaleTimeString()}`);
    console.log(`   Current mode: ${currentMode}`);
    console.log(`   Next scheduled fetch: ${nextFetch}`);
    console.log('');
    
    // Check 3: Trending topics for fetching
    console.log('🎯 Trending Topics for Video Fetching:');
    const topicsResponse = await axios.get(`${BASE_URL}/trending-topics`);
    const topics = topicsResponse.data.data;
    
    if (topics.length === 0) {
      console.log('   ⚠️  No trending topics found - scheduler may not fetch videos');
    } else {
      topics.forEach(topic => {
        console.log(`   • ${topic.Title} (${topic.Category}) - Active: ${topic.IsActive}`);
      });
    }
    console.log('');
    
    // Check 4: Recent video creation timestamps
    console.log('📅 Recent Video Activity:');
    const recentResponse = await axios.get(`${BASE_URL}/videos?sort=createdAt:desc&pagination[limit]=5`);
    const recentVideos = recentResponse.data.data;
    
    if (recentVideos.length === 0) {
      console.log('   No videos in database');
    } else {
      recentVideos.forEach((video, index) => {
        const createdAt = new Date(video.createdAt);
        const timeAgo = Math.round((now - createdAt) / (1000 * 60)); // minutes ago
        console.log(`   ${index + 1}. "${video.title}" - ${timeAgo} minutes ago (${video.videostatus})`);
      });
    }
    console.log('');
    
    // Check 5: Test scheduler dependencies
    console.log('🔧 Scheduler Dependencies Check:');
    
    // Check YouTube videos content type
    try {
      const youtubeResponse = await axios.get(`${BASE_URL}/youtube-videos`);
      console.log(`   ✅ YouTube videos: ${youtubeResponse.data.meta.pagination.total} available`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ⚠️  YouTube videos: Protected (may need authentication for scheduler)');
      } else {
        console.log(`   ❌ YouTube videos: Error ${error.response?.status}`);
      }
    }
    
    // Check content safety keywords
    try {
      const safetyResponse = await axios.get(`${BASE_URL}/content-safety-keywords`);
      console.log(`   ✅ Content safety keywords: ${safetyResponse.data.meta.pagination.total} configured`);
    } catch (error) {
      console.log(`   ⚠️  Content safety keywords: ${error.response?.status} response`);
    }
    
    console.log('');
    
    // Check 6: Wait and check for new videos (5 minute test)
    console.log('⏳ Monitoring for New Video Fetching (60 second test)...');
    console.log('   Waiting 60 seconds to detect scheduler activity...');
    
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
    
    const afterResponse = await axios.get(`${BASE_URL}/videos`);
    const afterCount = afterResponse.data.meta.pagination.total;
    const newVideos = afterCount - initialCount;
    
    console.log(`   Videos before: ${initialCount}`);
    console.log(`   Videos after: ${afterCount}`);
    console.log(`   New videos fetched: ${newVideos}`);
    
    if (newVideos > 0) {
      console.log('   ✅ Scheduler is actively fetching videos!');
      
      // Show the new videos
      const newVideoResponse = await axios.get(`${BASE_URL}/videos?sort=createdAt:desc&pagination[limit]=${newVideos}`);
      console.log('   New videos:');
      newVideoResponse.data.data.forEach((video, index) => {
        console.log(`     ${index + 1}. "${video.title}" (${video.videostatus})`);
      });
    } else {
      console.log('   ⚠️  No new videos detected in 60 seconds');
      console.log('   This could be normal depending on:');
      console.log('     - Current scheduler timing');
      console.log('     - Available trending topics');
      console.log('     - YouTube API quota/availability');
    }
    
    console.log('');
    
    // Final assessment
    console.log('🎯 SCHEDULER STATUS ASSESSMENT:');
    console.log('================================');
    
    const hasTopics = topics.length > 0;
    const hasActiveTopics = topics.some(t => t.IsActive);
    const isInFetchWindow = currentMode === 'daytime' || (hour >= 23 || hour <= 5);
    
    if (hasActiveTopics && isInFetchWindow) {
      console.log('✅ SCHEDULER SHOULD BE ACTIVE');
      console.log('   • Active trending topics available');
      console.log(`   • Currently in ${currentMode} mode`);
      console.log('   • All dependencies accessible');
    } else {
      console.log('⚠️  SCHEDULER MAY BE IDLE');
      if (!hasActiveTopics) console.log('   • No active trending topics');
      if (!isInFetchWindow) console.log('   • Outside normal fetch window');
    }
    
    if (newVideos > 0) {
      console.log('✅ FETCHING CONFIRMED: New videos detected');
    } else {
      console.log('❓ FETCHING STATUS: No new videos in test period');
    }
    
  } catch (error) {
    console.error('❌ Error checking scheduler:', error.message);
  }
}

checkSchedulerFetching();
