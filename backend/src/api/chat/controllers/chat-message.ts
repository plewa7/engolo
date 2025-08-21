// Kontroler czatu: pobieranie i wysyłanie wiadomości
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::chat.chat-message', ({ strapi }) => ({
  async find(ctx) {
    console.log('Find messages - query params:', JSON.stringify(ctx.query, null, 2));
    
    // Sprawdź czy to zapytanie o prywatne wiadomości
    const isPrivateMessageQuery = ctx.query.filters && 
                                  ctx.query.filters['$or'] && 
                                  ctx.query.filters['$or'][0] && 
                                  ctx.query.filters['$or'][0]['sender'];
    
    if (isPrivateMessageQuery) {
      // Dla prywatnych wiadomości - pobierz wszystkie i przefiltruj
      const currentUserId = ctx.state.user?.id;
      const otherUserId = ctx.query.filters['$or'][0]['receiver']['id'] || 
                          ctx.query.filters['$or'][1]['sender']['id'];
      
      console.log('Szukam prywatnych wiadomości między:', currentUserId, 'a', otherUserId);
      
      const messages = await strapi.entityService.findMany('api::chat.chat-message', {
        populate: ['sender', 'receiver'],
        sort: { createdAt: 'asc' },
      });
      
      // Filtruj wiadomości między dwoma użytkownikami
      const filteredMessages = messages.filter((msg: any) => {
        if (!msg.receiver) return false; // Tylko prywatne wiadomości
        const senderId = msg.sender?.id;
        const receiverId = msg.receiver?.id;
        
        return (senderId == currentUserId && receiverId == otherUserId) ||
               (senderId == otherUserId && receiverId == currentUserId);
      });
      
      console.log('Znaleziono prywatnych wiadomości:', filteredMessages.length);
      return filteredMessages;
    } else {
      // Dla wiadomości grupowych użyj standardowego serwisu
      const { results } = await strapi.service('api::chat.chat-message').find(ctx.query);
      console.log('Found group messages:', results.length);
      return results;
    }
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
