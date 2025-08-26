import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz-statistic.quiz-statistic', ({ strapi }) => ({
  async create(ctx) {
    console.log('🔥 CONTROLLER CALLED!');
    console.log('🔥 Auth user:', ctx.state.user);
    console.log('🔥 Original data:', ctx.request.body.data);

    // Wymuś przypisanie aktualnego użytkownika do relacji user
    const userId = ctx.state.user?.id;
    if (userId) {
      ctx.request.body.data.user = userId;
      console.log('✅ User assigned:', userId);
    } else {
      ctx.request.body.data.user = null;
      console.log('❌ No user found in context!');
    }

    // Usuń potencjalnie błędne pole user z atrybutów
    if (ctx.request.body.data.attributes && ctx.request.body.data.attributes.user) {
      delete ctx.request.body.data.attributes.user;
    }

    // WALIDACJA: nie pozwól na duplikaty (user + quizSetId)
    const quizSetId = ctx.request.body.data.quizSetId;
    if (userId && quizSetId) {
      const existing = await strapi.entityService.findMany('api::quiz-statistic.quiz-statistic', {
        filters: {
          user: userId,
          quizSetId: String(quizSetId)
        },
        limit: 1
      });
      if (existing && existing.length > 0) {
        console.log('🚫 Duplicate quiz-statistic found, returning existing:', existing[0]);
        ctx.status = 200;
        return { data: existing[0] };
      }
    }

    console.log('📊 Final data being sent:', ctx.request.body.data);

    // Wywołaj standardową funkcję create
    const response = await super.create(ctx);

    console.log('📊 Response from super.create:', response);

    // Jeśli user został przypisany, ale nie ma go w response, dodaj go ręcznie
    if (userId && response.data && !response.data.user) {
      response.data.user = { id: userId };
      console.log('🔧 Manually added user to response');
    }

    return response;
  }
}));
