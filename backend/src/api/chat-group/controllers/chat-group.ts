import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::chat-group.chat-group', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    // Znajdź grupy gdzie użytkownik jest członkiem
    const groups = await strapi.entityService.findMany('api::chat-group.chat-group' as any, {
      filters: {
        members: {
          id: user.id
        }
      },
      populate: ['members', 'creator'],
      sort: { createdAt: 'desc' },
    });

    return groups;
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { name, memberIds } = ctx.request.body.data || ctx.request.body;
    
    if (!name || !memberIds || !Array.isArray(memberIds)) {
      return ctx.badRequest('Name and memberIds are required');
    }

    // Dodaj twórcę do listy członków jeśli go tam nie ma
    const allMemberIds = [...new Set([user.id, ...memberIds])];

    const group = await strapi.entityService.create('api::chat-group.chat-group' as any, {
      data: {
        name,
        creator: user.id,
        members: allMemberIds,
        createdAt: new Date(),
      },
      populate: ['members', 'creator'],
    });

    return group;
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;
    
    // Sprawdź czy użytkownik jest twórcą grupy
    const group: any = await strapi.entityService.findOne('api::chat-group.chat-group' as any, id, {
      populate: ['creator']
    });

    if (!group || group.creator?.id !== user.id) {
      return ctx.forbidden('Only group creator can delete the group');
    }

    await strapi.entityService.delete('api::chat-group.chat-group' as any, id);
    return { message: 'Group deleted successfully' };
  }
}));
