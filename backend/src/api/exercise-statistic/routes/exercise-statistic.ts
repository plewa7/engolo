export default {
  routes: [
    {
      method: 'GET',
      path: '/exercise-statistics',
      handler: 'exercise-statistic.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/exercise-statistics/:id',
      handler: 'exercise-statistic.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/exercise-statistics',
      handler: 'exercise-statistic.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/exercise-statistics/:id',
      handler: 'exercise-statistic.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/exercise-statistics/:id',
      handler: 'exercise-statistic.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
