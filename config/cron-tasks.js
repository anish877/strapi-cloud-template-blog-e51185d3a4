module.exports = {
  newsFetchJob: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🔄 Running 1-minute news fetch...');
        const breakingNewsService = strapi.service('api::breaking-news.breaking-news');
        const result = await breakingNewsService.fetchAndProcessNews();
        if (result) {
          strapi.log.info(`🎯 News fetch completed: ${result.total} new articles (${result.approved} approved, ${result.needsReview} need review)`);
        } else {
          strapi.log.info('🎯 News fetch completed: No new articles');
        }
      } catch (error) {
        strapi.log.error('❌ Scheduled news fetch failed:', error.message);
      }
    },
    options: { rule: '*/5 * * * *' },
  },

  dynamicCleanupJob: {
    task: async ({ strapi }) => {
      try {
        const settings = await strapi.entityService.findOne('api::news-settings.news-settings', 1);
        if (!settings || !settings.cleanupFrequencyMinutes) return;
        const now = new Date();
        const lastRun = settings.lastCleanupRun ? new Date(settings.lastCleanupRun) : null;
        const frequencyMs = settings.cleanupFrequencyMinutes * 60 * 1000;
        if (lastRun && (now.getTime() - lastRun.getTime()) < frequencyMs) return;
        strapi.log.info('🧹 Running dynamic cleanup based on admin settings...');
        const cleanupResult = await strapi.controller('api::breaking-news.breaking-news').cleanup({
          state: {},
          throw: (code, message) => { throw new Error(`${code}: ${message}`); }
        });
        if (cleanupResult && cleanupResult.deletedCount > 0) {
          strapi.log.info(`✅ Dynamic cleanup completed: ${cleanupResult.deletedCount} articles deleted`);
        } else {
          strapi.log.info('✅ Dynamic cleanup completed: No articles needed deletion');
        }
      } catch (error) {
        strapi.log.error('❌ Dynamic cleanup failed:', error.message);
      }
    },
    options: { rule: '*/15 * * * *' },
  },

  dailyReviewFetchJob: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🔄 Running daily review fetch...');
        const ReviewFetcherService = require('../src/api/google-review/services/review-fetcher');
        const reviewFetcher = new ReviewFetcherService();
        const result = await reviewFetcher.fetchAllReviews();
        if (result.error) {
          strapi.log.error(`❌ Daily review fetch failed: ${result.error}`);
        } else {
          strapi.log.info(`🎯 Daily review fetch completed: ${result.total_fetched} reviews fetched, ${result.total_saved} saved from ${result.platforms_processed} platforms`);
        }
      } catch (error) {
        strapi.log.error('❌ Daily review fetch failed:', error.message);
      }
    },
    options: { rule: '0 6 * * *' },
  },

  dailyReviewCleanupJob: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🧹 Running daily review cleanup...');
        const result = await strapi.service('api::google-review.google-review').cleanupExpiredReviews();
        if (result.deleted_count > 0) {
          strapi.log.info(`✅ Review cleanup completed: ${result.deleted_count} expired reviews deleted`);
        } else {
          strapi.log.info('✅ Review cleanup completed: No expired reviews found');
        }
      } catch (error) {
        strapi.log.error('❌ Review cleanup failed:', error.message);
      }
    },
    options: { rule: '0 3 * * *' },
  },

  dailyRejectedCleanupJob: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🧹 Running daily rejected articles cleanup...');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const deletedArticles = await strapi.db.query('api::breaking-news.breaking-news').deleteMany({
          where: { moderationStatus: 'rejected', createdAt: { $lt: sevenDaysAgo } }
        });
        strapi.log.info(`✅ Daily rejected cleanup completed: ${deletedArticles.count} old rejected articles removed`);
      } catch (error) {
        strapi.log.error('❌ Daily rejected cleanup failed:', error.message);
      }
    },
    options: { rule: '0 2 * * *' },
  },

  /**
   * Daytime video fetching cron job
   * Runs every 30 minutes from 6 AM to 11 PM (Bangkok timezone)
   */
  videoDaytimeFetch: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🔄 Running daytime video fetch...');
        const videoService = strapi.service('api::video.video');
        const videos = await videoService.fetchVideosFromKeywords({
          maxResults: 5,
          saveToDatabase: true
        });
        
        // Save videos to database with duplicate prevention
        let savedCount = 0;
        for (const video of videos) {
          try {
            // Check if video already exists by video_id
            const existing = await strapi.entityService.findMany('api::video.video', {
              filters: { video_id: video.video_id },
              limit: 1
            });

            if (!Array.isArray(existing) || existing.length === 0) {
              await strapi.entityService.create('api::video.video', {
                data: {
                  ...video,
                  videostatus: video.status || 'pending'
                }
              });
              savedCount++;
            }
          } catch (saveError) {
            const message = saveError?.message || String(saveError);
            if (!message.toLowerCase().includes('unique') && !message.toLowerCase().includes('duplicate')) {
              strapi.log.error(`Error saving video: ${message}`);
            }
          }
        }
        
        strapi.log.info(`🎯 Daytime video fetch completed: ${videos.length} videos processed, ${savedCount} saved`);
      } catch (error) {
        strapi.log.error('❌ Daytime video fetch failed:', error.message);
      }
    },
    options: { 
      rule: '*/30 6-23 * * *', 
      tz: 'Asia/Bangkok' 
    },
  },

  /**
   * Nighttime video fetching cron job
   * Runs every 2 hours from 12 AM to 5 AM (Bangkok timezone)
   */
  videoNighttimeFetch: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🔄 Running nighttime video fetch...');
        const videoService = strapi.service('api::video.video');
        const videos = await videoService.fetchVideosFromKeywords({
          maxResults: 3,
          saveToDatabase: true
        });
        
        // Save videos to database with duplicate prevention
        let savedCount = 0;
        for (const video of videos) {
          try {
            // Check if video already exists by video_id
            const existing = await strapi.entityService.findMany('api::video.video', {
              filters: { video_id: video.video_id },
              limit: 1
            });

            if (!Array.isArray(existing) || existing.length === 0) {
              await strapi.entityService.create('api::video.video', {
                data: {
                  ...video,
                  videostatus: video.status || 'pending'
                }
              });
              savedCount++;
            }
          } catch (saveError) {
            const message = saveError?.message || String(saveError);
            if (!message.toLowerCase().includes('unique') && !message.toLowerCase().includes('duplicate')) {
              strapi.log.error(`Error saving video: ${message}`);
            }
          }
        }
        
        strapi.log.info(`🎯 Nighttime video fetch completed: ${videos.length} videos processed, ${savedCount} saved`);
      } catch (error) {
        strapi.log.error('❌ Nighttime video fetch failed:', error.message);
      }
    },
    options: { 
      rule: '0 */2 0-5 * * *', 
      tz: 'Asia/Bangkok' 
    },
  },

  /**
   * Trending video mode cron job
   * Runs every 5 minutes to check for active trending topics and fetch related videos
   */
  videoTrendingMode: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🔄 Checking trending mode...');
        // Check for active trending tags
        const activeTags = await strapi.entityService.findMany('api::trending-topic.trending-topic', {
          filters: { IsActive: true },
          fields: ['id', 'Title', 'hashtag', 'Rank']
        });

        if (activeTags && activeTags.length > 0) {
          strapi.log.info(`🔥 Found ${activeTags.length} active trending tags, fetching videos...`);
          const videoService = strapi.service('api::video.video');
          
          for (const tag of activeTags) {
            try {
              const keyword = tag.hashtag || tag.Title || '';
              if (keyword) {
                const videos = await videoService.fetchVideosByKeyword(keyword, {
                  maxResults: 8,
                  relevanceLanguage: 'en',
                  regionCode: 'TH'
                });

                // Save trending videos with higher priority
                let savedCount = 0;
                for (const video of videos) {
                  try {
                    const existing = await strapi.entityService.findMany('api::video.video', {
                      filters: { video_id: video.video_id },
                      limit: 1
                    });

                    if (!Array.isArray(existing) || existing.length === 0) {
                      await strapi.entityService.create('api::video.video', {
                        data: {
                          ...video,
                          videostatus: video.status || 'pending',
                          priority: tag.Rank || 5,
                          featured: true
                        }
                      });
                      savedCount++;
                    }
                  } catch (saveError) {
                    const message = saveError?.message || String(saveError);
                    if (!message.toLowerCase().includes('unique')) {
                      strapi.log.error(`Error saving trending video: ${message}`);
                    }
                  }
                }
                strapi.log.info(`🎯 Trending "${keyword}": ${savedCount} new videos saved`);
              }
            } catch (error) {
              strapi.log.error(`Error processing trending tag "${tag.Title}":`, error.message);
            }
          }
        }
      } catch (error) {
        strapi.log.error('❌ Trending mode fetch failed:', error.message);
      }
    },
    options: { rule: '*/5 * * * *', tz: 'Asia/Bangkok' },
  },

  /**
   * Video cleanup cron job
   * Runs daily at 2 AM (Bangkok timezone) to remove old inactive and rejected videos
   */
  videoCleanup: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🧹 Running video cleanup...');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Remove old inactive videos
        const deletedVideos = await strapi.db.query('api::video.video').deleteMany({
          where: {
            $and: [
              { videostatus: 'inactive' },
              { createdAt: { $lt: thirtyDaysAgo.toISOString() } }
            ]
          }
        });

        // Also remove old rejected videos (older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const deletedRejected = await strapi.db.query('api::video.video').deleteMany({
          where: {
            $and: [
              { videostatus: 'rejected' },
              { createdAt: { $lt: sevenDaysAgo.toISOString() } }
            ]
          }
        });

        const totalDeleted = (deletedVideos.count || 0) + (deletedRejected.count || 0);
        strapi.log.info(`🎯 Video cleanup completed: ${totalDeleted} videos removed (${deletedVideos.count || 0} inactive, ${deletedRejected.count || 0} rejected)`);
      } catch (error) {
        strapi.log.error('❌ Video cleanup failed:', error.message);
      }
    },
    options: { rule: '0 2 * * *', tz: 'Asia/Bangkok' },
  },

  /**
   * Video statistics update cron job
   * Runs every 6 hours to update keyword usage statistics and success rates
   */
  videoStatsUpdate: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('📊 Running video stats update...');
        
        // Update search keyword statistics
        const keywords = await strapi.entityService.findMany('api::video-search-keywords.video-search-keywords', {
          filters: { active: true },
          fields: ['id', 'keyword', 'usage_count', 'success_rate']
        });

        let updatedCount = 0;
        for (const keyword of keywords) {
          try {
            // Calculate recent video success rate (last 7 days)
            const recentVideos = await strapi.entityService.findMany('api::video.video', {
              filters: {
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
              }
            });

            const successRate = recentVideos.length > 0 ? Math.min(100, recentVideos.length * 10) : 50;

            // Update keyword statistics
            await strapi.entityService.update('api::video-search-keywords.video-search-keywords', keyword.id, {
              data: {
                last_used: new Date().toISOString(),
                success_rate: successRate
              }
            });

            updatedCount++;
          } catch (error) {
            strapi.log.error(`Error updating stats for keyword ${keyword.keyword}:`, error.message);
          }
        }

        strapi.log.info(`🎯 Video stats update completed: ${updatedCount} keywords updated`);
      } catch (error) {
        strapi.log.error('❌ Video stats update failed:', error.message);
      }
    },
    options: { rule: '0 */6 * * *', tz: 'Asia/Bangkok' },
  },

  currencyUpdate: {
    task: async ({ strapi }) => {
      try {
        const CurrencyScheduler = require('../src/services/currency-scheduler');
        const currencyScheduler = new CurrencyScheduler();
        await currencyScheduler.updateCurrencyData();
      } catch (error) {
        strapi.log.error('❌ Currency update failed:', error.message);
      }
    },
    options: { rule: '*/5 * * * *' },
  },

  travelTimesSummaryJob: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🛣️ Updating travel times summary...');
        await strapi.service('api::traffic-summary.traffic-summary').updateSummary();
      } catch (error) {
        strapi.log.error('❌ Travel times summary failed:', error.message);
      }
    },
    options: { rule: '*/20 * * * *' },
  },

  staticMapRefreshJob: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🗺️ Refreshing cached static traffic map...');
        await strapi.service('api::traffic-map.traffic-map').refreshStaticMap();
      } catch (error) {
        strapi.log.error('❌ Static map refresh failed:', error.message);
      }
    },
    options: { rule: '*/5 * * * *' },
  },
};
