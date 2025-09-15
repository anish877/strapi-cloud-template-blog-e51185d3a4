'use strict';

/**
 * forum-report router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    // Standard CRUD routes - temporarily disabled to fix startup
    // ...createCoreRouter('api::forum-report.forum-report').routes,
  ]
};
