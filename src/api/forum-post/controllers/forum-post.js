'use strict';

/**
 * forum-post controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

// @ts-ignore
module.exports = createCoreController('api::forum-post.forum-post', ({ strapi }) => ({
  // Custom controller methods
  async create(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }
    
    try {
      const { content, topic, parentPost, mentions, hashtags, attachments } = ctx.request.body.data;
      
      if (!content || !topic) {
        return ctx.badRequest('Content and topic are required');
      }
      
      // @ts-ignore
      const post = await strapi.entityService.create('api::forum-post.forum-post', {
        data: {
          content,
          topic,
          author: user.id,
          parentPost: parentPost || null,
          mentions: mentions || [],
          hashtags: hashtags || [],
          attachments: attachments || [],
          isBestAnswer: false,
          isEdited: false,
          viewCount: 0,
          isPinned: false,
          isLocked: false,
          moderationStatus: 'approved',
          reactionCounts: {
            like: 0,
            love: 0,
            laugh: 0,
            wow: 0,
            sad: 0,
            angry: 0
          },
          userReactions: {}
        }
      });
      
      // Update topic's last activity and post count
      // @ts-ignore
      const topicData = await strapi.entityService.findOne('api::forum-topic.forum-topic', topic, {
        populate: ['posts']
      });
      
      if (topicData) {
        // @ts-ignore
        await strapi.entityService.update('api::forum-topic.forum-topic', topic, {
          data: {
            lastActivity: new Date().toISOString(),
            // @ts-ignore
            postCount: (topicData.postCount || 0) + 1,
            lastPost: post.id
          }
        });
      }
      
      strapi.log.info(`Post created: ${post.id} by user ${user.id} in topic ${topic}`);
      return ctx.send({ data: post });
    } catch (error) {
      strapi.log.error('Error creating post:', error);
      return ctx.internalServerError('Failed to create post');
    }
  },
  
  async find(ctx) {
    try {
      // @ts-ignore
      const posts = await strapi.entityService.findMany('api::forum-post.forum-post', {
        populate: ['author', 'topic', 'parentPost', 'parentPost.author', 'reactions', 'reactions.user'],
        sort: { createdAt: 'asc' },
        ...ctx.query
      });
      
      return ctx.send({ data: posts });
    } catch (error) {
      strapi.log.error('Error fetching posts:', error);
      return ctx.internalServerError('Failed to fetch posts');
    }
  },
  
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      
      // @ts-ignore
      const post = await strapi.entityService.findOne('api::forum-post.forum-post', id, {
        populate: ['author', 'topic', 'parentPost', 'parentPost.author', 'reactions', 'reactions.user']
      });
      
      if (!post) {
        return ctx.notFound('Post not found');
      }
      
      // Increment view count
      // @ts-ignore
      await strapi.entityService.update('api::forum-post.forum-post', id, {
        // @ts-ignore
        data: { viewCount: (post.viewCount || 0) + 1 }
      });
      
      return ctx.send({ data: post });
    } catch (error) {
      strapi.log.error('Error fetching post:', error);
      return ctx.internalServerError('Failed to fetch post');
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
      
      // Check if user owns the post or is admin
      // @ts-ignore
      const existingPost = await strapi.entityService.findOne('api::forum-post.forum-post', id, {
        populate: ['author']
      });
      
      if (!existingPost) {
        return ctx.notFound('Post not found');
      }
      
      // @ts-ignore
      const isOwner = existingPost.author && existingPost.author.id === user.id;
      const isAdmin = user.role && (user.role.name === 'admin' || user.role.type === 'admin');
      
      if (!isOwner && !isAdmin) {
        return ctx.forbidden('Only post owner or admin can update');
      }
      
      // @ts-ignore
      const updatedPost = await strapi.entityService.update('api::forum-post.forum-post', id, {
        data: {
          ...updateData,
          isEdited: true,
          editedAt: new Date().toISOString()
        }
      });
      
      return ctx.send({ data: updatedPost });
    } catch (error) {
      strapi.log.error('Error updating post:', error);
      return ctx.internalServerError('Failed to update post');
    }
  },
  
  async delete(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }
    
    try {
      const { id } = ctx.params;
      
      // Check if user owns the post or is admin
      // @ts-ignore
      const existingPost = await strapi.entityService.findOne('api::forum-post.forum-post', id, {
        populate: ['author', 'topic']
      });
      
      if (!existingPost) {
        return ctx.notFound('Post not found');
      }
      
      // @ts-ignore
      const isOwner = existingPost.author && existingPost.author.id === user.id;
      const isAdmin = user.role && (user.role.name === 'admin' || user.role.type === 'admin');
      
      if (!isOwner && !isAdmin) {
        return ctx.forbidden('Only post owner or admin can delete');
      }
      
      // @ts-ignore
      await strapi.entityService.delete('api::forum-post.forum-post', id);
      
      // Update topic's post count
      // @ts-ignore
      if (existingPost.topic) {
        // @ts-ignore
        const topicData = await strapi.entityService.findOne('api::forum-topic.forum-topic', existingPost.topic.id);
        if (topicData) {
          // @ts-ignore
          await strapi.entityService.update('api::forum-topic.forum-topic', existingPost.topic.id, {
            data: {
              // @ts-ignore
              postCount: Math.max(0, (topicData.postCount || 1) - 1)
            }
          });
        }
      }
      
      return ctx.send({ message: 'Post deleted successfully' });
    } catch (error) {
      strapi.log.error('Error deleting post:', error);
      return ctx.internalServerError('Failed to delete post');
    }
  },

  async markBestAnswer(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }
    
    const userId = user.id;
    
    try {
      strapi.log.info(`Marking best answer for post ${id} by user ${userId}`);
      
      // Find the post
      // @ts-ignore
      const post = await strapi.entityService.findOne('api::forum-post.forum-post', id, {
        populate: ['topic', 'topic.author']
      });
      
      if (!post) {
        strapi.log.warn(`Post ${id} not found`);
        return ctx.notFound('Post not found');
      }
      
      // @ts-ignore
      if (!post.topic) {
        strapi.log.warn(`Post ${id} has no associated topic`);
        return ctx.badRequest('Post has no associated topic');
      }
      
      // Check if user is the topic author or admin
      // @ts-ignore
      const isTopicAuthor = post.topic.author && post.topic.author.id === userId;
      const isAdmin = user.role && (user.role.name === 'admin' || user.role.type === 'admin');
      
      strapi.log.info(`Permission check - isTopicAuthor: ${isTopicAuthor}, isAdmin: ${isAdmin}`);
      
      if (!isTopicAuthor && !isAdmin) {
        strapi.log.warn(`User ${userId} not authorized to mark best answer for post ${id}`);
        return ctx.forbidden('Only topic author or admin can mark best answer');
      }
      
      // Mark as best answer
      // @ts-ignore
      const updatedPost = await strapi.entityService.update('api::forum-post.forum-post', id, {
        data: { isBestAnswer: true }
      });
      
      strapi.log.info(`Post ${id} marked as best answer`);
      
      // Update topic as solved
      // @ts-ignore
      await strapi.entityService.update('api::forum-topic.forum-topic', post.topic.id, {
        data: { isSolved: true, bestAnswer: id }
      });
      
      // @ts-ignore
      strapi.log.info(`Topic ${post.topic.id} marked as solved`);
      
      return ctx.send({ data: updatedPost, message: 'Post marked as best answer' });
    } catch (error) {
      strapi.log.error('Error marking best answer:', error);
      return ctx.internalServerError('Failed to mark best answer');
    }
  }
}));