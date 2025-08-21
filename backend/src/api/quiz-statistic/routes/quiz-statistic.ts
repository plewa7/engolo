export default {
  routes: [
    {
      method: 'GET',
      path: '/quiz-statistics',
      handler: 'quiz-statistic.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/quiz-statistics/:id',
      handler: 'quiz-statistic.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/quiz-statistics',
      handler: 'quiz-statistic.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/quiz-statistics/:id',
      handler: 'quiz-statistic.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/quiz-statistics/:id',
      handler: 'quiz-statistic.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
