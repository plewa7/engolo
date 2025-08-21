import { factories } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/chat-messages',
      handler: 'chat-message.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/chat-messages',
      handler: 'chat-message.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Routes dla grup - używamy prefiks chat-messages
    {
      method: 'GET',
      path: '/chat-messages/groups',
      handler: 'chat-message.getGroups',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/chat-messages/groups',
      handler: 'chat-message.createGroup',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/chat-messages/groups/:id',
      handler: 'chat-message.deleteGroup',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ]
};
