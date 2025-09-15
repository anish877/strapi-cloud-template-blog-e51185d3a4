'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

// @ts-ignore
// @ts-ignore
module.exports = createCoreController('api::hashtag.hashtag', ({ strapi }) => ({
  async find(ctx) {
    try {
      // @ts-ignore
      const hashtags = await strapi.entityService.findMany('api::hashtag.hashtag', {
        sort: { usage_count: 'desc' }
      });

      return { data: hashtags };
    } catch (error) {
      console.error('Error fetching hashtags:', error);
      return ctx.badRequest('Failed to fetch hashtags');
    }
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    
    try {
      // @ts-ignore
      const hashtag = await strapi.entityService.findOne('api::hashtag.hashtag', id, {
        populate: ['photos']
      });

      if (!hashtag) {
        return ctx.notFound('Hashtag not found');
      }

      return { data: hashtag };
    } catch (error) {
      console.error('Error fetching hashtag:', error);
      return ctx.badRequest('Failed to fetch hashtag');
    }
  },

  async getTrending(ctx) {
    const { limit = 20 } = ctx.query;
    
    try {
      // @ts-ignore
      const hashtags = await strapi.entityService.findMany('api::hashtag.hashtag', {
        filters: { is_trending: true },
        sort: { usage_count: 'desc' },
        // @ts-ignore
        limit: parseInt(String(limit))
      });

      return { data: hashtags };
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      return ctx.badRequest('Failed to fetch trending hashtags');
    }
  },

  async getPopular(ctx) {
    const { limit = 50 } = ctx.query;
    
    try {
      // @ts-ignore
      const hashtags = await strapi.entityService.findMany('api::hashtag.hashtag', {
        sort: { usage_count: 'desc' },
        // @ts-ignore
        limit: parseInt(String(limit))
      });

      return { data: hashtags };
    } catch (error) {
      console.error('Error fetching popular hashtags:', error);
      return ctx.badRequest('Failed to fetch popular hashtags');
    }
  },

  async createOrFind(ctx) {
    const { name } = ctx.request.body;

    if (!name) {
      return ctx.badRequest('Hashtag name is required');
    }

    try {
      // Normalize hashtag name (remove # if present, lowercase)
      const normalizedName = name.replace(/^#/, '').toLowerCase();
      
      // Check if hashtag already exists
      // @ts-ignore
      let hashtags = await strapi.entityService.findMany('api::hashtag.hashtag', {
        filters: { name: normalizedName }
      });

      // @ts-ignore
      if (hashtags && Array.isArray(hashtags) && hashtags.length > 0) {
        // Increment usage count
        // @ts-ignore
        const hashtag = await strapi.entityService.update('api::hashtag.hashtag', hashtags[0].id, {
          // @ts-ignore
          data: { usage_count: (hashtags[0].usage_count || 0) + 1 }
        });
        console.log(`📝 Hashtag "${normalizedName}" usage count incremented`);
        return { data: hashtag };
      } else {
        // Create new hashtag
        // @ts-ignore
        const hashtag = await strapi.entityService.create('api::hashtag.hashtag', {
          data: {
            name: normalizedName,
            slug: normalizedName, // Add slug field as required by schema
            usage_count: 1
          }
        });
        console.log(`🆕 New hashtag "${normalizedName}" created`);
        return { data: hashtag };
      }
    } catch (error) {
      console.error('Error creating/finding hashtag:', error);
      return ctx.badRequest('Failed to create/find hashtag: ' + error.message);
    }
  }
}));
