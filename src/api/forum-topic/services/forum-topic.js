'use strict';

/**
 * forum-topic service
 */

const { createCoreService } = require('@strapi/strapi').factories;

// @ts-ignore
module.exports = createCoreService('api::forum-topic.forum-topic', ({ strapi }) => ({
  // Custom service methods can be added here
}));
