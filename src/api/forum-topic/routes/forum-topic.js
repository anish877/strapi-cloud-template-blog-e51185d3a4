'use strict';

/**
 * forum-topic router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Use manual routes to ensure custom controller methods are called
module.exports = {
  routes: [
    // Manual CRUD routes for forum-topics
    {
      method: 'GET',
      path: '/forum-topics',
      handler: 'forum-topic.find',
      config: {
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/forum-topics/:id',
      handler: 'forum-topic.findOne',
      config: {
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/forum-topics',
      handler: 'forum-topic.create',
      config: {
        auth: false // Let Firebase middleware handle authentication
      }
    },
    {
      method: 'PUT',
      path: '/forum-topics/:id',
      handler: 'forum-topic.update',
      config: {
        auth: false // Let Firebase middleware handle authentication
      }
    },
    {
      method: 'DELETE',
      path: '/forum-topics/:id',
      handler: 'forum-topic.delete',
      config: {
        auth: false // Let Firebase middleware handle authentication
      }
    }
  ]
};
