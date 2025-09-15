'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    // Public routes
    {
      method: 'GET',
      path: '/hashtags',
      handler: 'hashtag.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/hashtags/:id',
      handler: 'hashtag.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/hashtags/trending',
      handler: 'hashtag.getTrending',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/hashtags/popular',
      handler: 'hashtag.getPopular',
      config: {
        auth: false,
      },
    },
    // Public routes for hashtag creation
    {
      method: 'POST',
      path: '/hashtags/create-or-find',
      handler: 'hashtag.createOrFind',
      config: {
        auth: false,
      },
    },
  ],
};
