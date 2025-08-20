export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: 'http://localhost:5173', // zmiana: string zamiast tablicy
      headers: [
        'Content-Type',
        'Authorization',
        'Origin',
        'Accept',
        'x-requested-with',
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
