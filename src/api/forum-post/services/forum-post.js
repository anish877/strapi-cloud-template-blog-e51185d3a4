'use strict';

/**
 * forum-post service
 */

const { createCoreService } = require('@strapi/strapi').factories;

// @ts-ignore
module.exports = createCoreService('api::forum-post.forum-post', ({ strapi }) => ({
  // Custom service methods can be added here
}));
