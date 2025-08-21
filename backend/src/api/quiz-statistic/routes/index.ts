export default {
  routes: [
    {
      method: 'GET',
      path: '/quiz-statistics',
      handler: 'quiz-statistic.find',
    },
    {
      method: 'POST',
      path: '/quiz-statistics',
      handler: 'quiz-statistic.create',
    },
  ],
};
