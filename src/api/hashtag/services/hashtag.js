'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::hashtag.hashtag', ({ strapi }) => ({
  async normalizeHashtagName(name) {
    // Remove # if present, convert to lowercase, trim whitespace
    return name.replace(/^#/, '').toLowerCase().trim();
  },

  async createOrUpdateHashtag(name) {
    const normalizedName = await this.normalizeHashtagName(name);
    
    // Check if hashtag exists
    const existingHashtags = await strapi.entityService.findMany('api::hashtag.hashtag', {
      filters: { name: normalizedName }
    });

    if (existingHashtags && existingHashtags.length > 0) {
      // Update usage count
      const hashtag = await strapi.entityService.update('api::hashtag.hashtag', existingHashtags[0].id, {
        data: { usage_count: (existingHashtags[0].usage_count || 0) + 1 }
      });
      return hashtag;
    } else {
      // Create new hashtag
      const hashtag = await strapi.entityService.create('api::hashtag.hashtag', {
        data: {
          name: normalizedName,
          usage_count: 1
        }
      });
      return hashtag;
    }
  },

  async updateTrendingStatus() {
    // Get hashtags with high usage count
    const popularHashtags = await strapi.entityService.findMany('api::hashtag.hashtag', {
      sort: { usage_count: 'desc' },
      limit: 10
    });

    // Reset all trending flags
    await strapi.entityService.updateMany('api::hashtag.hashtag', {
      filters: { is_trending: true },
      data: { is_trending: false }
    });

    // Set top hashtags as trending
    if (popularHashtags && popularHashtags.length > 0) {
      const trendingIds = popularHashtags.slice(0, 5).map(h => h.id);
      await strapi.entityService.updateMany('api::hashtag.hashtag', {
        filters: { id: { $in: trendingIds } },
        data: { is_trending: true }
      });
    }
  },

  async getHashtagStats() {
    const totalHashtags = await strapi.entityService.count('api::hashtag.hashtag');
    const trendingHashtags = await strapi.entityService.count('api::hashtag.hashtag', {
      filters: { is_trending: true }
    });
    const mostUsedHashtag = await strapi.entityService.findMany('api::hashtag.hashtag', {
      sort: { usage_count: 'desc' },
      limit: 1
    });

    return {
      total: totalHashtags,
      trending: trendingHashtags,
      mostUsed: mostUsedHashtag && mostUsedHashtag.length > 0 ? mostUsedHashtag[0] : null
    };
  }
}));
