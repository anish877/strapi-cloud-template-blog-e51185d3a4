const axios = require('axios');
const Parser = require('rss-parser');
const DynamicCleanupManager = require('./dynamic-cleanup-manager');
const OptimizedAlgoliaService = require('./optimized-algolia-service');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
      ['description', 'fullDescription']
    ]
  }
});

class NewsScheduler {
  constructor() {
    this.fetchCount = 0;
    this.isRunning = false;
    this.cleanupManager = new DynamicCleanupManager();
    this.algoliaService = new OptimizedAlgoliaService();
    
    // Built-in fallback news sources
    this.builtInNewsSources = [
      {
        id: 'fallback-1',
        name: 'Pattaya Mail',
        url: 'http://www.pattayamail.com/rss.xml',
        sourceType: 'rss_feed',
        isActive: true,
        category: 'Local News',
        priority: 1
      },
      {
        id: 'fallback-2',
        name: 'The Pattaya News',
        url: 'http://thepattayanews.com/feed/',
        sourceType: 'rss_feed',
        isActive: true,
        category: 'Local News',
        priority: 1
      },
      {
        id: 'fallback-3',
        name: 'Bangkok Post',
        url: 'http://www.bangkokpost.com/rss/data/news.xml',
        sourceType: 'rss_feed',
        isActive: true,
        category: 'National News',
        priority: 2
      },
      {
        id: 'fallback-4',
        name: 'The Nation Thailand',
        url: 'http://www.nationthailand.com/rss/home.xml',
        sourceType: 'rss_feed',
        isActive: true,
        category: 'National News',
        priority: 2
      }
    ];
    
    // Built-in fallback news settings (matching schema defaults)
    this.builtInNewsSettings = {
      fetchIntervalMinutes: 30,
      moderationKeywords: ["spam", "fake", "clickbait", "scam", "adult", "explicit"],
      autoModerationEnabled: true,
      maxArticlesPerFetch: 20,
      enableVoting: true,
      cronJobEnabled: true,
      newsApiCountry: "us",
      newsApiCategory: "general",
      maxArticleLimit: 21,
      maxArticleAgeHours: 24,
      cleanupMode: "both_count_and_age",
      cleanupFrequencyMinutes: 60,
      preservePinnedArticles: true,
      preserveBreakingNews: true,
      cleanupStats: {
        totalDeleted: 0,
        lastDeletedCount: 0,
        lastCleanupDate: null
      },
      // Legacy compatibility
      enableAlgoliaSync: false
    };
  }

  async fetchNews() {
    if (this.isRunning) {
      console.log('⏳ Previous fetch still running, skipping...');
      return;
    }

    this.isRunning = true;
    this.fetchCount++;
    
    try {
      console.log(`🔄 [${new Date().toLocaleTimeString()}] News fetch #${this.fetchCount} starting...`);
      
      // Get active sources with graceful fallback
      let activeSources = [];
      let usingFallbackSources = false;
      
      try {
        const sourcesResponse = await axios.get('http://localhost:1337/api/news-sources');
        const dbSources = sourcesResponse.data.data || [];
        activeSources = dbSources.filter(s => s.isActive === true);
        
        if (activeSources.length > 0) {
          console.log(`   ✅ Using ${activeSources.length} database news sources`);
          console.log(`   📰 Sources: ${activeSources.map(s => s.name).join(', ')}`);
        } else {
          console.log('   ℹ️  No active sources in database, using built-in fallback...');
          activeSources = this.builtInNewsSources;
          usingFallbackSources = true;
        }
      } catch (error) {
        console.log(`   ⚠️  Could not fetch news sources (${error.message}), using built-in fallback...`);
        activeSources = this.builtInNewsSources;
        usingFallbackSources = true;
      }
      
      if (usingFallbackSources) {
        console.log(`   🔄 Using ${activeSources.length} built-in fallback sources`);
        console.log(`   📰 Fallback sources: ${activeSources.map(s => s.name).join(', ')}`);
      }
      
      console.log(`   📡 Found ${activeSources.length} active news sources`);
      
      // Use the global parser instance
      
      let totalCreated = 0;
      
      for (const source of activeSources) {
        try {
          if (source.sourceType === 'rss_feed' && source.url) {
            console.log(`   🔍 Fetching from ${source.name}...`);
            const feed = await parser.parseURL(source.url);
            // Get settings to determine how many articles to fetch per source
            const settings = await this.getNewsSettings();
            const maxArticlesPerFetch = settings.maxArticlesPerFetch || 2;
            const articles = feed.items.slice(0, maxArticlesPerFetch);
            
            for (const item of articles) {
              try {
                // Check for duplicates with graceful fallback
                let isDuplicate = false;
                try {
                  const existing = await axios.get(`http://localhost:1337/api/breaking-news-plural?filters[URL][$eq]=${encodeURIComponent(item.link)}`);
                  isDuplicate = existing.data.data.length > 0;
                } catch (error) {
                  console.log('⚠️  Could not check duplicates, proceeding with article creation');
                  isDuplicate = false; // Assume not duplicate if API unavailable
                }
                
                if (!isDuplicate) {
                  // Get settings for content processing
                  const settings = await this.getNewsSettings();
                  
                  // Clean content with configurable length
                  let cleanContent = item.contentSnippet || item.content || item.summary || '';
                  cleanContent = cleanContent.replace(/<[^>]*>/g, '').substring(0, settings.maxContentLength || 500);
                  
                  // Apply content moderation
                  const moderationResult = this.shouldModerateContent(item.title || '', cleanContent, settings);
                  if (moderationResult.shouldModerate) {
                    console.log(`     🚫 Skipping article due to moderation: ${moderationResult.reason}`);
                    continue;
                  }
                  
                  // Extract featured image
                  let featuredImage = null;
                  let imageAlt = '';
                  let imageCaption = '';
                  
                  // Method 1: Check media fields
                  if (item.mediaContent && item.mediaContent.url) {
                    featuredImage = item.mediaContent.url;
                  } else if (item.mediaThumbnail && item.mediaThumbnail.url) {
                    featuredImage = item.mediaThumbnail.url;
                  } else if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
                    featuredImage = item.enclosure.url;
                  }
                  
                  // Method 2: Extract from content
                  if (!featuredImage) {
                    const contentToSearch = item.content || item.description || item.fullDescription || '';
                    const imgRegex = /<img[^>]+src="([^">]+)"/i;
                    const match = imgRegex.exec(contentToSearch);
                    if (match) {
                      featuredImage = match[1];
                      
                      // Extract alt text
                      const altRegex = /<img[^>]+alt="([^">]*)"/i;
                      const altMatch = altRegex.exec(contentToSearch);
                      if (altMatch) {
                        imageAlt = altMatch[1];
                      }
                    }
                  }
                  
                  // Ensure full URL for relative paths
                  if (featuredImage && !featuredImage.startsWith('http')) {
                    const sourceUrl = new URL(source.url);
                    featuredImage = `${sourceUrl.protocol}//${sourceUrl.hostname}${featuredImage.startsWith('/') ? '' : '/'}${featuredImage}`;
                  }
                  
                  // Check for breaking news keywords
                  const breakingKeywords = ['breaking', 'urgent', 'alert', 'emergency', 'developing', 'just in'];
                  const isBreaking = breakingKeywords.some(keyword => 
                    item.title.toLowerCase().includes(keyword) || 
                    cleanContent.toLowerCase().includes(keyword)
                  );
                  
                  if (isBreaking) {
                    console.log(`     🚨 BREAKING NEWS detected: ${item.title}...`);
                  }
                  
                  if (featuredImage) {
                    console.log(`     🖼️  Image found: ${featuredImage.substring(0, 60)}...`);
                  }

                  const breakingNewsData = {
                    Title: item.title,
                    Summary: cleanContent,
                    Severity: isBreaking ? 'high' : 'medium',
                    Category: item.categories?.[0] || 'General',
                    Source: source.name,
                    URL: item.link,
                    IsBreaking: isBreaking,
                    PublishedTimestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
                    isPinned: false,
                    voteScore: 0,
                    upvotes: 0,
                    downvotes: 0,
                    moderationStatus: 'approved',
                    isHidden: false,
                    fetchedFromAPI: true,
                    apiSource: source.name,
                    originalAPIData: item,
                    FeaturedImage: featuredImage,
                    ImageAlt: imageAlt,
                    ImageCaption: imageCaption,
                    publishedAt: new Date()
                  };

                  // Post article with graceful fallback
                  try {
                    const response = await axios.post('http://localhost:1337/api/breaking-news-plural', {
                      data: breakingNewsData
                    });
                    
                    // Index the new breaking news item in Algolia (if enabled)
                    if (settings.enableAlgoliaSync) {
                      try {
                        await this.algoliaService.addItem('breaking-news', response.data.data);
                        console.log(`     🔍 Indexed in Algolia: ${item.title.substring(0, 50)}...`);
                      } catch (algoliaError) {
                        console.log(`     ⚠️  Algolia indexing failed: ${algoliaError.message}`);
                      }
                    }
                    
                    totalCreated++;
                    console.log(`     ✅ Created: ${item.title.substring(0, 50)}...`);
                  } catch (postError) {
                    console.log(`     ⚠️  Could not post article, will retry later: ${item.title.substring(0, 50)}...`);
                    // Store failed articles for retry (could implement queue here)
                  }
                }
              } catch (createError) {
                continue;
              }
            }
          }
        } catch (sourceError) {
          console.log(`   ❌ ${source.name}: ${sourceError.message}`);
        }
      }
      
      // Check current article count and limit before cleanup
      const currentCountResponse = await axios.get('http://localhost:1337/api/breaking-news-plural');
      const currentCount = currentCountResponse.data.data.length;
      
      // Get settings with fallback
      let settings = await this.getNewsSettings();
      
      const maxLimit = settings.maxArticleLimit;
      
      console.log(`📊 Current articles: ${currentCount}/${maxLimit}`);
      
      // Only trigger cleanup if we exceed the limit
      if (currentCount > maxLimit) {
        console.log(`⚠️  Exceeded limit by ${currentCount - maxLimit} articles - triggering cleanup`);
        await this.cleanupManager.trigger();
      } else if (currentCount < maxLimit) {
        console.log(`📈 ${maxLimit - currentCount} slots available for more articles`);
      } else {
        console.log(`✅ At optimal limit of ${maxLimit} articles`);
      }
      
      console.log(`✅ [${new Date().toLocaleTimeString()}] Fetch #${this.fetchCount} completed: ${totalCreated} new articles`);
      
    } catch (error) {
      console.log(`❌ [${new Date().toLocaleTimeString()}] Fetch #${this.fetchCount} failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  async cleanupOldArticles() {
    try {
      console.log('   🧹 Checking article count and cleaning up old articles...');
      
      // Get cleanup settings
      const cleanupSettings = await this.getNewsSettings();
      const maxArticleLimit = cleanupSettings.maxArticleLimit;
      
      // Get all breaking news articles ordered by creation date (newest first)
      const allArticles = await axios.get('http://localhost:1337/api/breaking-news-plural?sort=createdAt:desc&pagination[limit]=200');
      const articles = allArticles.data.data;
      
      console.log(`   📊 Found ${articles.length} total articles`);
      
      // If we have more than the configured limit, delete the oldest ones
      if (articles.length > maxArticleLimit) {
        const articlesToDelete = articles.slice(maxArticleLimit); // Get articles beyond the limit
        console.log(`   🗑️  Deleting ${articlesToDelete.length} oldest articles to maintain limit of ${maxArticleLimit}`);
        
        for (const article of articlesToDelete) {
          try {
            await axios.delete(`http://localhost:1337/api/breaking-news-plural/${article.id}`);
            console.log(`   ✅ Deleted article: ${article.Title.substring(0, 50)}...`);
          } catch (deleteError) {
            console.log(`   ❌ Failed to delete article ${article.id}: ${deleteError.message}`);
          }
        }
        
        console.log(`   ✅ Cleanup completed. Maintained limit of ${maxArticleLimit} articles.`);
      } else {
        console.log(`   ✅ Article count (${articles.length}) is within limit of ${maxArticleLimit}. No cleanup needed.`);
      }
      
    } catch (error) {
      console.log(`   ❌ Cleanup failed: ${error.message}`);
    }
  }

  async start(intervalMinutes) {
    // Get settings to determine fetch interval
    const settings = await this.getNewsSettings();
    const fetchInterval = intervalMinutes || settings.fetchIntervalMinutes || 5;
    
    console.log(`🚀 Starting news scheduler (every ${fetchInterval} minute(s))...`);
    console.log(`   📋 Settings: maxArticlesPerFetch=${settings.maxArticlesPerFetch}, autoModeration=${settings.autoModerationEnabled}`);
    
    // Start the dynamic cleanup manager
    this.cleanupManager.start();
    
    // Initial fetch
    this.fetchNews();
    
    // Set up interval based on settings
    setInterval(() => {
      this.fetchNews();
    }, fetchInterval * 60 * 1000);
    
    return Promise.resolve(); // Return a promise for bootstrap compatibility
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('🛑 News scheduler stopped');
    }
  }

  getStatus() {
    return {
      running: !!this.interval,
      fetchCount: this.fetchCount,
      currentlyFetching: this.isRunning
    };
  }

  // Get news settings with proper priority: database first, then fallback
  async getNewsSettings() {
    try {
      const settingsResponse = await axios.get('http://localhost:1337/api/news-settings');
      const dbSettings = settingsResponse.data.data;
      
      if (dbSettings && Object.keys(dbSettings).length > 0) {
        // Priority 1: Use database settings, merge with fallback for missing fields
        const settings = { ...this.builtInNewsSettings, ...dbSettings };
        console.log(`   ⚙️  Using database settings (fetchInterval: ${settings.fetchIntervalMinutes}min, maxLimit: ${settings.maxArticleLimit})`);
        return settings;
      } else {
        console.log('   ℹ️  No settings in database, using built-in fallback');
        console.log(`   🔄 Using built-in settings (fetchInterval: ${this.builtInNewsSettings.fetchIntervalMinutes}min, maxLimit: ${this.builtInNewsSettings.maxArticleLimit})`);
        return this.builtInNewsSettings;
      }
    } catch (error) {
      console.log(`   ⚠️  Could not fetch settings (${error.message}), using built-in fallback`);
      console.log(`   🔄 Using built-in settings (fetchInterval: ${this.builtInNewsSettings.fetchIntervalMinutes}min, maxLimit: ${this.builtInNewsSettings.maxArticleLimit})`);
      return this.builtInNewsSettings;
    }
  }

  // Content moderation using news settings
  shouldModerateContent(title, content, settings) {
    if (!settings.autoModerationEnabled) {
      return { shouldModerate: false, reason: null };
    }
    
    const moderationKeywords = settings.moderationKeywords || [];
    const textToCheck = `${title} ${content}`.toLowerCase();
    
    for (const keyword of moderationKeywords) {
      if (textToCheck.includes(keyword.toLowerCase())) {
        return {
          shouldModerate: true,
          reason: `Contains moderation keyword: ${keyword}`
        };
      }
    }
    
    return { shouldModerate: false, reason: null };
  }

  // Advanced cleanup based on news settings
  async performAdvancedCleanup(settings) {
    try {
      const currentTime = new Date();
      const maxAgeMs = settings.maxArticleAgeHours * 60 * 60 * 1000;
      const cutoffTime = new Date(currentTime.getTime() - maxAgeMs);
      
      console.log(`   🧹 Advanced cleanup: mode=${settings.cleanupMode}, maxAge=${settings.maxArticleAgeHours}h, maxCount=${settings.maxArticleLimit}`);
      
      const articlesResponse = await axios.get('http://localhost:1337/api/breaking-news-plural');
      const allArticles = articlesResponse.data.data || [];
      
      let articlesToDelete = [];
      
      // Apply cleanup logic based on mode
      switch (settings.cleanupMode) {
        case 'age_only':
          articlesToDelete = allArticles.filter(article => {
            const articleDate = new Date(article.publishedAt);
            const shouldDelete = articleDate < cutoffTime;
            
            // Preserve special articles
            if (settings.preservePinnedArticles && article.isPinned) return false;
            if (settings.preserveBreakingNews && article.isBreaking) return false;
            
            return shouldDelete;
          });
          break;
          
        case 'count_only':
          if (allArticles.length > settings.maxArticleLimit) {
            const sortedArticles = allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            articlesToDelete = sortedArticles.slice(settings.maxArticleLimit);
            
            // Filter out preserved articles
            articlesToDelete = articlesToDelete.filter(article => {
              if (settings.preservePinnedArticles && article.isPinned) return false;
              if (settings.preserveBreakingNews && article.isBreaking) return false;
              return true;
            });
          }
          break;
          
        case 'both_count_and_age':
        default:
          // First remove old articles
          const oldArticles = allArticles.filter(article => {
            const articleDate = new Date(article.publishedAt);
            const shouldDelete = articleDate < cutoffTime;
            
            if (settings.preservePinnedArticles && article.isPinned) return false;
            if (settings.preserveBreakingNews && article.isBreaking) return false;
            
            return shouldDelete;
          });
          
          // Then check count limit on remaining articles
          const remainingArticles = allArticles.filter(article => !oldArticles.includes(article));
          let excessArticles = [];
          
          if (remainingArticles.length > settings.maxArticleLimit) {
            const sortedRemaining = remainingArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            excessArticles = sortedRemaining.slice(settings.maxArticleLimit).filter(article => {
              if (settings.preservePinnedArticles && article.isPinned) return false;
              if (settings.preserveBreakingNews && article.isBreaking) return false;
              return true;
            });
          }
          
          articlesToDelete = [...oldArticles, ...excessArticles];
          break;
      }
      
      if (articlesToDelete.length > 0) {
        console.log(`   🗑️  Deleting ${articlesToDelete.length} articles based on cleanup rules`);
        
        for (const article of articlesToDelete) {
          try {
            await axios.delete(`http://localhost:1337/api/breaking-news-plural/${article.id}`);
          } catch (deleteError) {
            console.log(`   ⚠️  Failed to delete article ${article.id}: ${deleteError.message}`);
          }
        }
        
        // Update cleanup stats
        const updatedStats = {
          ...settings.cleanupStats,
          totalDeleted: (settings.cleanupStats.totalDeleted || 0) + articlesToDelete.length,
          lastDeletedCount: articlesToDelete.length,
          lastCleanupDate: currentTime.toISOString()
        };
        
        try {
          await axios.put('http://localhost:1337/api/news-settings', {
            data: {
              cleanupStats: updatedStats,
              lastCleanupRun: currentTime.toISOString()
            }
          });
        } catch (updateError) {
          console.log(`   ⚠️  Could not update cleanup stats: ${updateError.message}`);
        }
        
        console.log(`   ✅ Cleanup completed: ${articlesToDelete.length} articles removed`);
      } else {
        console.log(`   ✅ No cleanup needed: ${allArticles.length} articles within limits`);
      }
      
    } catch (error) {
      console.log(`   ❌ Advanced cleanup failed: ${error.message}`);
    }
  }
}

// Export for use in Strapi
module.exports = NewsScheduler;

// If run directly, start the scheduler
if (require.main === module) {
  const scheduler = new NewsScheduler();
  scheduler.start(); // Use settings-based interval
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down news scheduler...');
    scheduler.stop();
    process.exit(0);
  });
  
  // Keep the process alive
  console.log('📡 News scheduler running. Press Ctrl+C to stop.');
}