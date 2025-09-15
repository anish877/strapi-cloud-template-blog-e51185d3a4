'use strict';

/**
 * forum-reaction router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    // Standard CRUD routes - temporarily disabled to fix startup
    // ...createCoreRouter('api::forum-reaction.forum-reaction').routes,
    
    // Custom reaction routes
    {
      method: 'POST',
      path: '/forum-reactions/add',
      handler: 'forum-reaction.addReaction',
      config: {
        auth: false // Let Firebase middleware handle authentication
      }
    },
    {
      method: 'GET',
      path: '/forum-reactions/user-reactions',
      handler: 'forum-reaction.getUserReactions',
      config: {
        auth: false // Let Firebase middleware handle authentication
      }
    }
  ]
};
