'use strict';
require('dotenv').config({ silent: true })

const Hapi = require('@hapi/hapi');
const routes = require('./features/routes/routes');
const HapiCron = require('hapi-cron');
const { registerErrorLogging } = require('./features/errors/errors.logger');

const init = async () => {

  const server = Hapi.server({
    port: process.env.PORT || 4000,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
  });

  registerErrorLogging(server);

  try {
    await server.register({
      plugin: HapiCron,
      options: {
        jobs: require('./features/cron/cron')
      }
    });

    server.route(routes)

    await server.start();
    console.log('Le serveur est en ligne sur %s', server.info.uri);
  }
  catch (err) {
    console.error('Erreur lors du démarrage du serveur', err);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});


init();
