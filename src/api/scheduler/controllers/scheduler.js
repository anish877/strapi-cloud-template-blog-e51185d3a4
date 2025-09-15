'use strict';

/**
 * Manual Scheduler Triggers Controller
 * Provides endpoints to manually start news and video schedulers
 */

const path = require('path');

module.exports = {
  /**
   * Manual trigger for News Scheduler (5 min interval)
   * POST /api/scheduler/news/start
   */
  async startNewsScheduler(ctx) {
    try {
      console.log('🗞️ Manual trigger: Starting News Scheduler...');
      
      // Import and start the alternative news scheduler
      const NewsSchedulerPath = path.join(process.cwd(), 'scripts', 'alternative-scheduler.js');
      const NewsScheduler = require(NewsSchedulerPath);
      
      // Create new instance and start
      const scheduler = new NewsScheduler();
      
      // Start scheduler in background (non-blocking)
      setImmediate(() => {
        scheduler.start().catch(error => {
          console.error('❌ News Scheduler error:', error.message);
        });
      });
      
      ctx.body = {
        success: true,
        message: 'News Scheduler started successfully',
        scheduler: 'alternative-scheduler.js',
        interval: '5 minutes',
        status: 'running',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to start News Scheduler:', error.message);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: 'Failed to start News Scheduler',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Manual trigger for Video Scheduler (2 min interval)
   * POST /api/scheduler/video/start
   */
  async startVideoScheduler(ctx) {
    try {
      console.log('🎬 Manual trigger: Starting Video Scheduler...');
      
      // Import and start the alternative video scheduler
      const VideoSchedulerPath = path.join(process.cwd(), 'scripts', 'alternative-video-scheduler.js');
      const VideoScheduler = require(VideoSchedulerPath);
      
      // Create new instance and start
      const scheduler = new VideoScheduler();
      
      // Start scheduler in background (non-blocking)
      setImmediate(() => {
        scheduler.start().catch(error => {
          console.error('❌ Video Scheduler error:', error.message);
        });
      });
      
      ctx.body = {
        success: true,
        message: 'Video Scheduler started successfully',
        scheduler: 'alternative-video-scheduler.js',
        interval: '2 minutes',
        status: 'running',
        builtInTopics: 10,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to start Video Scheduler:', error.message);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: 'Failed to start Video Scheduler',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Start both schedulers at once
   * POST /api/scheduler/start-all
   */
  async startAllSchedulers(ctx) {
    try {
      console.log('🚀 Manual trigger: Starting ALL Schedulers...');
      
      const results = {
        news: { success: false },
        video: { success: false }
      };
      
      // Start News Scheduler
      try {
        const NewsSchedulerPath = path.join(process.cwd(), 'scripts', 'alternative-scheduler.js');
        const NewsScheduler = require(NewsSchedulerPath);
        const newsScheduler = new NewsScheduler();
        
        setImmediate(() => {
          newsScheduler.start().catch(error => {
            console.error('❌ News Scheduler error:', error.message);
          });
        });
        
        results.news = { success: true, interval: '5 minutes' };
        console.log('✅ News Scheduler started');
        
      } catch (error) {
        results.news = { success: false, error: error.message };
        console.error('❌ News Scheduler failed:', error.message);
      }
      
      // Start Video Scheduler
      try {
        const VideoSchedulerPath = path.join(process.cwd(), 'scripts', 'alternative-video-scheduler.js');
        const VideoScheduler = require(VideoSchedulerPath);
        const videoScheduler = new VideoScheduler();
        
        setImmediate(() => {
          videoScheduler.start().catch(error => {
            console.error('❌ Video Scheduler error:', error.message);
          });
        });
        
        results.video = { success: true, interval: '2 minutes', builtInTopics: 10 };
        console.log('✅ Video Scheduler started');
        
      } catch (error) {
        results.video = { success: false, error: error.message };
        console.error('❌ Video Scheduler failed:', error.message);
      }
      
      const allSuccess = results.news.success && results.video.success;
      
      ctx.body = {
        success: allSuccess,
        message: allSuccess ? 'All schedulers started successfully' : 'Some schedulers failed to start',
        schedulers: results,
        timestamp: new Date().toISOString()
      };
      
      if (!allSuccess) {
        ctx.status = 500;
      }
      
    } catch (error) {
      console.error('❌ Failed to start schedulers:', error.message);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: 'Failed to start schedulers',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Get scheduler status
   * GET /api/scheduler/status
   */
  async getStatus(ctx) {
    try {
      // Check if schedulers are running by looking for their processes
      const status = {
        news: {
          name: 'News Scheduler',
          file: 'scripts/alternative-scheduler.js',
          interval: '5 minutes',
          status: 'unknown'
        },
        video: {
          name: 'Video Scheduler', 
          file: 'scripts/alternative-video-scheduler.js',
          interval: '2 minutes',
          status: 'unknown'
        }
      };
      
      ctx.body = {
        success: true,
        schedulers: status,
        endpoints: {
          startNews: 'POST /api/scheduler/news/start',
          startVideo: 'POST /api/scheduler/video/start',
          startAll: 'POST /api/scheduler/start-all',
          status: 'GET /api/scheduler/status'
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: 'Failed to get scheduler status',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};
