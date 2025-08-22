import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz-statistic.quiz-statistic', ({ strapi }) => ({
  async create(ctx) {
    console.log('🔥 CONTROLLER CALLED!');
    console.log('🔥 Auth user:', ctx.state.user);
    console.log('🔥 Original data:', ctx.request.body.data);
    
    // Automatycznie przypisz aktualnego użytkownika
    const userId = ctx.state.user?.id;
    if (userId) {
      ctx.request.body.data.user = userId;
      console.log('✅ User assigned:', userId);
    } else {
      console.log('❌ No user found in context!');
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
