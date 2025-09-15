'use strict';

/**
 * forum-reaction controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

// Helper function to update reaction counts
async function updateReactionCounts(targetId, oldType, newType, oldAction, newAction, isTopicReaction = false) {
  try {
    let entity;
    
    if (isTopicReaction) {
      // @ts-ignore
      entity = await strapi.entityService.findOne('api::forum-topic.forum-topic', targetId);
    } else {
      // @ts-ignore
      entity = await strapi.entityService.findOne('api::forum-post.forum-post', targetId);
    }
    
    if (!entity) return;
    
    // Get current reaction counts, defaulting to zero if not set
    const currentCounts = {
      like: 0, love: 0, laugh: 0, wow: 0, sad: 0, angry: 0
    };
    
    // Decrement old reaction if changing
    if (oldType && oldAction === 'decrement') {
      currentCounts[oldType] = Math.max(0, currentCounts[oldType] - 1);
    }
    
    // Increment new reaction
    if (newType && newAction === 'increment') {
      currentCounts[newType] = (currentCounts[newType] || 0) + 1;
    }
    
    // Update the entity with new counts
    if (isTopicReaction) {
      // @ts-ignore
      await strapi.entityService.update('api::forum-topic.forum-topic', targetId, {
        data: { reactionCounts: currentCounts }
      });
    } else {
      // @ts-ignore
      await strapi.entityService.update('api::forum-post.forum-post', targetId, {
        data: { reactionCounts: currentCounts }
      });
    }
  } catch (error) {
    strapi.log.error('Error updating reaction counts:', error);
  }
}

// @ts-ignore
module.exports = createCoreController('api::forum-reaction.forum-reaction', ({ strapi }) => ({
  // Custom controller methods
  async addReaction(ctx) {
    const { postId, topicId, type } = ctx.request.body;
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }
    
    const userId = user.id;
    
    if ((!postId && !topicId) || !type) {
      return ctx.badRequest('Post ID or Topic ID and reaction type are required');
    }
    
    // Determine if this is a topic or post reaction
    const isTopicReaction = !!topicId;
    const targetId = isTopicReaction ? topicId : postId;
    
    try {
      // Check if user already reacted to this post/topic
      const filters = { user: userId };
      if (isTopicReaction) {
        filters.topic = targetId;
      } else {
        filters.post = targetId;
      }
      
      // @ts-ignore
      const existingReaction = await strapi.entityService.findMany('api::forum-reaction.forum-reaction', {
        filters
      });
      
      // @ts-ignore
      if (existingReaction && existingReaction.length > 0) {
        // Update existing reaction
        const oldType = existingReaction[0].type;
        // @ts-ignore
        const updatedReaction = await strapi.entityService.update('api::forum-reaction.forum-reaction', existingReaction[0].id, {
          data: { type }
        });
        
        // Update reaction counts on the post/topic
        await updateReactionCounts(targetId, oldType, type, 'decrement', 'increment', isTopicReaction);
        
        return ctx.send({ data: updatedReaction, message: 'Reaction updated' });
      } else {
        // Create new reaction
        const reactionData = {
          type,
          user: userId
        };
        
        if (isTopicReaction) {
          reactionData.topic = targetId;
        } else {
          reactionData.post = targetId;
        }
        
        // @ts-ignore
        const newReaction = await strapi.entityService.create('api::forum-reaction.forum-reaction', {
          data: reactionData
        });
        
        // Update reaction counts on the post/topic
        await updateReactionCounts(targetId, null, type, null, 'increment', isTopicReaction);
        
        return ctx.send({ data: newReaction, message: 'Reaction added' });
      }
    } catch (error) {
      strapi.log.error('Error adding reaction:', error);
      return ctx.internalServerError('Failed to add reaction');
    }
  },
  
  async getUserReactions(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }
    
    const userId = user.id;
    
    try {
      // @ts-ignore
      const reactions = await strapi.entityService.findMany('api::forum-reaction.forum-reaction', {
        filters: { user: userId },
        populate: ['post']
      });
      
      return ctx.send({ data: reactions });
    } catch (error) {
      strapi.log.error('Error getting user reactions:', error);
      return ctx.internalServerError('Failed to get user reactions');
    }
  }
}));