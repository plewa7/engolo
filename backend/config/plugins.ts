export default () => ({
  'users-permissions': {
    config: {
      jwtSecret: process.env.JWT_SECRET || 'defaultSecret',
    },
  },
});
