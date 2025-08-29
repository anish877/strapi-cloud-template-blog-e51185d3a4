'use strict';

/**
 * search-log service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::search-log.search-log');
