#!/usr/bin/env node

/**
 * Dynamic Cleanup Manager
 * Monitors settings changes and automatically adjusts article count
 * Can be run standalone or integrated with the scheduler
 */

const axios = require('axios');
const SQLCleanupManager = require('./sql-cleanup-manager');

class DynamicCleanupManager {
  constructor() {
    this.currentLimit = null;
    this.isRunning = false;
    this.checkInterval = 30000; // 30 seconds
    this.intervalId = null;
    this.sqlCleanup = new SQLCleanupManager();
  }

  async getCurrentSettings() {
    try {
      const response = await axios.get('http://localhost:1337/api/news-settings');
      return response.data.data;
    } catch (error) {
      console.log(`⚠️  Could not fetch settings: ${error.message}`);
      return null;
    }
  }

  async getCurrentArticleCount() {
    try {
      const response = await axios.get('http://localhost:1337/api/breaking-news-plural?sort=createdAt:desc&pagination[limit]=200');
      return response.data.data;
    } catch (error) {
      console.log(`❌ Failed to fetch articles: ${error.message}`);
      return [];
    }
  }

  async cleanupOldArticles(maxArticles) {
    try {
      console.log(`🗑️  Starting SQL-based cleanup to maintain ${maxArticles} articles...`);
      
      // Use SQL cleanup manager instead of broken API
      const result = await this.sqlCleanup.enforceLimit();
      
      if (result.success) {
        console.log(`✅ SQL cleanup successful: ${result.deleted} articles deleted`);
        console.log(`📊 Final count: ${result.finalCount}/${result.maxLimit}`);
      } else {
        console.log(`❌ SQL cleanup failed: ${result.error || result.message}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async smartCleanup(currentLimit, articles) {
    const currentCount = articles.length;
    console.log(`📊 Current articles: ${currentCount}, Target limit: ${currentLimit}`);

    if (currentCount === currentLimit) {
      console.log(`✅ Article count matches limit. No action needed.`);
      return { action: 'none', count: 0 };
    }

    if (currentCount > currentLimit) {
      // Need to delete excess articles
      const excessCount = currentCount - currentLimit;
      const articlesToDelete = articles.slice(currentLimit);
      
      console.log(`🗑️  Deleting ${excessCount} excess articles...`);
      
      let deletedCount = 0;
      let deletedBreaking = 0;
      
      for (const article of articlesToDelete) {
        try {
          await axios.delete(`http://localhost:1337/api/breaking-news-plural/${article.id}`);
          console.log(`   ✅ Deleted: ${article.Title.substring(0, 40)}... ${article.IsBreaking ? '(BREAKING)' : ''}`);
          deletedCount++;
          if (article.IsBreaking) deletedBreaking++;
        } catch (deleteError) {
          console.log(`   ❌ Failed to delete article ${article.id}: ${deleteError.message}`);
        }
      }
      
      return { 
        action: 'deleted', 
        count: deletedCount, 
        breakingCount: deletedBreaking,
        message: `Deleted ${deletedCount} articles (${deletedBreaking} breaking news)`
      };
    } else {
      // Current count is less than limit - space for more articles
      const availableSpace = currentLimit - currentCount;
      console.log(`📈 Space available for ${availableSpace} more articles`);
      
      return { 
        action: 'space_available', 
        count: availableSpace,
        message: `${availableSpace} slots available for new articles`
      };
    }
  }

  async checkAndAdjust() {
    if (this.isRunning) {
      console.log('⏳ Cleanup already running, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Checking for settings changes...`);
      
      // Get current settings
      const settings = await this.getCurrentSettings();
      if (!settings) {
        console.log('⚠️  No settings found, skipping check');
        return;
      }

      const currentLimit = settings.maxArticleLimit || 21;
      
      // Check if limit has changed
      if (this.lastKnownLimit === null) {
        this.lastKnownLimit = currentLimit;
        console.log(`🎯 Initial limit detected: ${currentLimit}`);
      } else if (this.lastKnownLimit !== currentLimit) {
        console.log(`🔄 Limit changed: ${this.lastKnownLimit} → ${currentLimit}`);
        this.lastKnownLimit = currentLimit;
      } else {
        console.log(`✅ Limit unchanged: ${currentLimit}`);
        return; // No change, no action needed
      }

      // Get current articles
      const articles = await this.getCurrentArticleCount();
      
      // Perform smart cleanup
      const result = await this.smartCleanup(currentLimit, articles);
      
      console.log(`🎉 Cleanup result: ${result.message || result.action}`);
      
      // If limit increased and we have space, trigger news fetch to populate
      if (result.action === 'space_available' && result.count > 0) {
        console.log(`🚀 Limit increased - triggering news fetch to populate ${result.count} available slots...`);
        await this.triggerNewsFetch();
      }
      
    } catch (error) {
      console.log(`❌ Dynamic cleanup failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    console.log('🚀 Starting Dynamic Cleanup Manager...');
    console.log(`⏰ Checking for changes every ${this.checkInterval / 1000} seconds`);
    
    // Initial check
    this.checkAndAdjust();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkAndAdjust();
    }, this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Dynamic Cleanup Manager stopped');
    }
  }

  // Manual trigger for immediate cleanup
  async trigger() {
    console.log('🔧 Manual trigger activated...');
    await this.checkAndAdjust();
  }

  // Trigger news fetch to populate articles when limit increases
  async triggerNewsFetch() {
    try {
      console.log('📡 Triggering news fetch to populate available slots...');
      
      // Import and run the news scheduler fetch
      const NewsScheduler = require('./alternative-scheduler');
      const scheduler = new NewsScheduler();
      
      // Run a single fetch cycle
      await scheduler.fetchNews();
      
      console.log('✅ News fetch completed to populate new slots');
    } catch (error) {
      console.log(`❌ Failed to trigger news fetch: ${error.message}`);
    }
  }
}

// Export for use in other modules
module.exports = DynamicCleanupManager;

// If run directly, start the manager
if (require.main === module) {
  const manager = new DynamicCleanupManager();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    manager.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down gracefully...');
    manager.stop();
    process.exit(0);
  });
  
  // Start the manager
  manager.start();
}