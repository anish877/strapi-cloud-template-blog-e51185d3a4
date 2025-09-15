'use strict';

/**
 * Manual Scheduler Triggers Routes
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/schedulers/news/start',
      handler: 'scheduler.startNewsScheduler',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/schedulers/video/start',
      handler: 'scheduler.startVideoScheduler',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/schedulers/start-all',
      handler: 'scheduler.startAllSchedulers',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/schedulers/status',
      handler: 'scheduler.getStatus',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
