// Kontroler czatu: pobieranie i wysyłanie wiadomości
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::chat.chat-message', ({ strapi }) => ({
  async find(ctx) {
    // Możliwość filtrowania po grupie
    const { group } = ctx.query;
    const messages = await strapi.entityService.findMany('api::chat.chat-message', {
      filters: group ? { group } : {},
      populate: ['sender'],
      sort: { createdAt: 'asc' },
    });
    return messages;
  },

  async create(ctx) {
    // Obsługa zarówno ctx.request.body.data jak i ctx.request.body
    const requestData = ctx.request.body.data || ctx.request.body;
    const { content, group, receiver } = requestData;
    const user = ctx.state.user;
    
    console.log('Create message - request body:', JSON.stringify(ctx.request.body, null, 2));
    console.log('Create message - extracted data:', { content, group, receiver, userId: user?.id });
    
    if (!user) return ctx.unauthorized();
    if (!content) return ctx.badRequest('Content is required');
    
    const messageData: any = {
      content,
      sender: user.id,
      createdAt: new Date(),
    };
    
    // Jeśli jest receiver, to wiadomość prywatna
    if (receiver) {
      messageData.receiver = receiver;
    } else {
      // Jeśli nie ma receiver, to wiadomość grupowa
      messageData.group = group;
    }
    
    const message = await strapi.entityService.create('api::chat.chat-message', {
      data: messageData,
      populate: ['sender', 'receiver'],
    });
    return message;
  },
}));
