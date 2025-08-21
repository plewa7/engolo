export default {
  routes: [
    {
      method: 'GET',
      path: '/chat-groups',
      handler: 'chat-group.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/chat-groups',
      handler: 'chat-group.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/chat-groups/:id',
      handler: 'chat-group.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ]
};
