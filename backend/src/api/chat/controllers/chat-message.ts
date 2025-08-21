// Kontroler czatu: pobieranie i wysyłanie wiadomości
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::chat.chat-message', ({ strapi }) => ({
  async find(ctx) {
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
      
      return filteredMessages;
    } else {
      // Dla wiadomości grupowych użyj standardowego serwisu
      const { results } = await strapi.service('api::chat.chat-message').find(ctx.query);
      
      // Filtruj wiadomości systemowe
      const filteredResults = Array.isArray(results) ? 
        results.filter((msg: any) => !msg.content?.startsWith('#GRUPA_INFO#')) : 
        results;
      
      return filteredResults;
    }
  },

  async create(ctx) {
    // Obsługa zarówno ctx.request.body.data jak i ctx.request.body
    const requestData = ctx.request.body.data || ctx.request.body;
    const { content, group, receiver, groupId } = requestData;
    const user = ctx.state.user;
    
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
    } else if (groupId) {
      // Wiadomość do grupy (używamy groupId jako nazwy grupy)
      messageData.group = `group_${groupId}`;
    } else {
      // Jeśli nie ma receiver ani groupId, to wiadomość do starej grupy
      messageData.group = group;
    }
    
    const message = await strapi.entityService.create('api::chat.chat-message' as any, {
      data: messageData,
      populate: ['sender', 'receiver'],
    });
    
    return message;
  },

  // Prostsze metody dla grup (bez bazy danych)
  async getGroups(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    // Pobierz wszystkie wiadomości grupowe systemowe z informacjami o grupach
    const messages = await strapi.entityService.findMany('api::chat.chat-message' as any, {
      filters: {
        content: {
          $startsWith: '#GRUPA_INFO#'
        }
      },
      populate: ['sender'],
      sort: { createdAt: 'desc' },
    });

    const userGroups = [];
    const messagesArray = Array.isArray(messages) ? messages : (messages as any).data || [];
    
    // Sprawdź wiadomości systemowe z informacjami o grupach
    for (const message of messagesArray) {
      try {
        const groupInfoJson = message.content.replace('#GRUPA_INFO#', '');
        const groupInfo = JSON.parse(groupInfoJson);
        
        // Sprawdź czy user jest członkiem tej grupy
        if (groupInfo.members && groupInfo.members.includes(user.id)) {
          userGroups.push({
            id: groupInfo.id,
            name: groupInfo.name,
            members: groupInfo.members.map((id: number) => ({ id })),
            creator: { id: groupInfo.creator },
            createdAt: groupInfo.createdAt
          });
        }
      } catch (error) {
        // Silent error handling
      }
    }

    return userGroups;
  },

  async createGroup(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized();
    }

    const { name, memberIds } = ctx.request.body.data || ctx.request.body;
    
    if (!name || !memberIds || !Array.isArray(memberIds)) {
      return ctx.badRequest('Name and memberIds are required');
    }

    // Stwórz prostą grupę z unikalnym ID
    const groupId = Date.now().toString();
    
    // Dodaj twórcę do listy członków
    const allMemberIds = [...new Set([user.id, ...memberIds])];
    
    // Zapisz informację o grupie w formie specjalnej wiadomości systemowej
    const groupInfoMessage = await strapi.entityService.create('api::chat.chat-message' as any, {
      data: {
        content: `#GRUPA_INFO#${JSON.stringify({
          id: groupId,
          name: name,
          creator: user.id,
          members: allMemberIds,
          createdAt: new Date()
        })}`,
        sender: user.id,
        group: `group_${groupId}`,
        createdAt: new Date(),
      },
      populate: ['sender'],
    });

    const group = {
      id: groupId,
      name,
      creator: { id: user.id, username: user.username },
      members: allMemberIds.map(id => ({ id })),
      createdAt: new Date(),
    };

    return group;
  },

  async deleteGroup(ctx) {
    // Placeholder - na razie nie implementujemy usuwania
    return { message: 'Group deletion not implemented yet' };
  },
}));
