'use strict';

/**
 * forum-topic controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

// @ts-ignore
module.exports = createCoreController('api::forum-topic.forum-topic', ({ strapi }) => ({
  // Custom controller methods
  async create(ctx) {
    strapi.log.info('🔥 Custom create method called');
    strapi.log.info('🔥 ctx.state.user:', ctx.state.user);
    
    const user = ctx.state.user;
    
    if (!user) {
      strapi.log.warn('🔥 No user found in ctx.state.user');
      return ctx.unauthorized('Authentication required');
    }
    
    strapi.log.info('🔥 User authenticated:', user.id, user.username);
    
    try {
      strapi.log.info('🔥 Request body:', JSON.stringify(ctx.request.body, null, 2));
      
      const { title, content, category, excerpt } = ctx.request.body.data;
      
      strapi.log.info('🔥 Extracted data:', { title, content, category, excerpt });
      
      if (!title || !content || !category) {
        strapi.log.warn('🔥 Missing required fields');
        return ctx.badRequest('Title, content, and category are required');
      }
      
      // Generate slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      // @ts-ignore
      const topic = await strapi.entityService.create('api::forum-topic.forum-topic', {
        data: {
          title,
          content,
          category,
          excerpt: excerpt || content.substring(0, 200),
          slug,
          author: user.id,
          lastActivity: new Date().toISOString(),
          postCount: 0,
          viewCount: 0,
          isPinned: false,
          isLocked: false,
          isHot: false,
          isSolved: false,
          moderationStatus: 'approved'
        }
      });
      
      strapi.log.info(`Topic created: ${topic.id} by user ${user.id}`);
      return ctx.send({ data: topic });
    } catch (error) {
      strapi.log.error('Error creating topic:', error);
      return ctx.internalServerError('Failed to create topic');
    }
  },
  
  async find(ctx) {
    try {
      // @ts-ignore
      const topics = await strapi.entityService.findMany('api::forum-topic.forum-topic', {
        populate: ['author', 'category', 'lastPost', 'lastPost.author', 'reactions', 'reactions.user'],
        sort: { lastActivity: 'desc' },
        ...ctx.query
      });
      
      return ctx.send({ data: topics });
    } catch (error) {
      strapi.log.error('Error fetching topics:', error);
      return ctx.internalServerError('Failed to fetch topics');
    }
  },
  
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      
      // @ts-ignore
      const topic = await strapi.entityService.findOne('api::forum-topic.forum-topic', id, {
        populate: ['author', 'category', 'posts', 'posts.author', 'bestAnswer', 'bestAnswer.author', 'reactions', 'reactions.user']
      });
      
      if (!topic) {
        return ctx.notFound('Topic not found');
      }
      
      // Increment view count
      // @ts-ignore
      await strapi.entityService.update('api::forum-topic.forum-topic', id, {
        // @ts-ignore
        data: { viewCount: (topic.viewCount || 0) + 1 }
      });
      
      return ctx.send({ data: topic });
    } catch (error) {
      strapi.log.error('Error fetching topic:', error);
      return ctx.internalServerError('Failed to fetch topic');
    }
  },
  
  async update(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }
    
    try {
      const { id } = ctx.params;
      const updateData = ctx.request.body.data;
      
      // Check if user owns the topic or is admin
      // @ts-ignore
      const existingTopic = await strapi.entityService.findOne('api::forum-topic.forum-topic', id, {
        populate: ['author']
      });
      
      if (!existingTopic) {
        return ctx.notFound('Topic not found');
      }
      
      // @ts-ignore
      const isOwner = existingTopic.author && existingTopic.author.id === user.id;
      const isAdmin = user.role && (user.role.name === 'admin' || user.role.type === 'admin');
      
      if (!isOwner && !isAdmin) {
        return ctx.forbidden('Only topic owner or admin can update');
      }
      
      // @ts-ignore
      const updatedTopic = await strapi.entityService.update('api::forum-topic.forum-topic', id, {
        data: {
          ...updateData,
          lastActivity: new Date().toISOString()
        }
      });
      
      return ctx.send({ data: updatedTopic });
    } catch (error) {
      strapi.log.error('Error updating topic:', error);
      return ctx.internalServerError('Failed to update topic');
    }
  },
  
  async delete(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }
    
    try {
      const { id } = ctx.params;
      
      // Check if user owns the topic or is admin
      // @ts-ignore
      const existingTopic = await strapi.entityService.findOne('api::forum-topic.forum-topic', id, {
        populate: ['author']
      });
      
      if (!existingTopic) {
        return ctx.notFound('Topic not found');
      }
      
      // @ts-ignore
      const isOwner = existingTopic.author && existingTopic.author.id === user.id;
      const isAdmin = user.role && (user.role.name === 'admin' || user.role.type === 'admin');
      
      if (!isOwner && !isAdmin) {
        return ctx.forbidden('Only topic owner or admin can delete');
      }
      
      // @ts-ignore
      await strapi.entityService.delete('api::forum-topic.forum-topic', id);
      
      return ctx.send({ message: 'Topic deleted successfully' });
    } catch (error) {
      strapi.log.error('Error deleting topic:', error);
      return ctx.internalServerError('Failed to delete topic');
    }
  }
}));
