'use strict';

/**
 * forum-post router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    // Manual CRUD routes for forum-posts
    {
      method: 'GET',
      path: '/forum-posts',
      handler: 'forum-post.find',
      config: {
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/forum-posts/:id',
      handler: 'forum-post.findOne',
      config: {
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/forum-posts',
      handler: 'forum-post.create',
      config: {
        auth: false // Let Firebase middleware handle authentication
      }
    },
    {
      method: 'PUT',
      path: '/forum-posts/:id',
      handler: 'forum-post.update',
      config: {
        auth: false // Let Firebase middleware handle authentication
      }
    },
    {
      method: 'DELETE',
      path: '/forum-posts/:id',
      handler: 'forum-post.delete',
      config: {
        auth: false // Let Firebase middleware handle authentication
      }
    },
    
    // Custom forum post routes
    {
      method: 'POST',
      path: '/forum-posts/:id/mark-best-answer',
      handler: 'forum-post.markBestAnswer',
      config: {
        auth: false // Let Firebase middleware handle authentication
      }
    }
  ]
};
