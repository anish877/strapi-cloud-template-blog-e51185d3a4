'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    // Public routes - specific routes first to avoid conflicts
    {
      method: 'GET',
      path: '/photos/latest',
      handler: 'photo.getLatest',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/photos/trending',
      handler: 'photo.getTrending',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/photos',
      handler: 'photo.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/photos/:id',
      handler: 'photo.findOne',
      config: {
        auth: false,
      },
    },
    // Authenticated routes for photo creation
    {
      method: 'POST',
      path: '/photos',
      handler: 'photo.create',
      config: {
        auth: false, // Disable Strapi's built-in auth, rely on our Firebase middleware
      },
    },
    {
      method: 'POST',
      path: '/photos/:id/like',
      handler: 'photo.like',
      config: {
        auth: false, // Disable Strapi's built-in auth, rely on our Firebase middleware
      },
    },
    // Admin routes
    {
      method: 'GET',
      path: '/photos/pending',
      handler: 'photo.getPending',
      config: {
        auth: false, // Disable Strapi's built-in auth, rely on our Firebase middleware
      },
    },
    {
      method: 'POST',
      path: '/photos/:id/approve',
      handler: 'photo.approve',
      config: {
        auth: false, // Disable Strapi's built-in auth, rely on our Firebase middleware
      },
    },
    {
      method: 'POST',
      path: '/photos/:id/reject',
      handler: 'photo.reject',
      config: {
        auth: false, // Disable Strapi's built-in auth, rely on our Firebase middleware
      },
    },
    {
      method: 'GET',
      path: '/photos/:id/debug',
      handler: 'photo.debugPhoto',
      config: {
        auth: false,
      },
    },
  ],
};
