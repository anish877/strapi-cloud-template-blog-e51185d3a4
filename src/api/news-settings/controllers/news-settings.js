'use strict';

/**
 * news-settings controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::news-settings.news-settings', ({ strapi }) => ({
  async find(ctx) {
    // Override find to handle singleType properly
    try {
      const entity = await strapi.entityService.findMany('api::news-settings.news-settings');
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      // If no settings exist, return default structure
      return this.transformResponse(null);
    }
  },

  async update(ctx) {
    // Override update to handle singleType creation/update
    try {
      const { data } = ctx.request.body;
      
      // Try to find existing settings
      let entity = await strapi.entityService.findMany('api::news-settings.news-settings');
      
      if (entity) {
        // Update existing
        entity = await strapi.entityService.update('api::news-settings.news-settings', entity.id, { data });
      } else {
        // Create new
        entity = await strapi.entityService.create('api::news-settings.news-settings', { data });
      }
      
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      ctx.throw(500, error);
    }
  }
}));
