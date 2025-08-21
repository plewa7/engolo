export default {
  routes: [
    {
      method: 'GET',
      path: '/user-progress',
      handler: 'user-progress.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-progress/:id',
      handler: 'user-progress.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/user-progress',
      handler: 'user-progress.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/user-progress/:id',
      handler: 'user-progress.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/user-progress/:id',
      handler: 'user-progress.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
