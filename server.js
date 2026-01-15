'use strict';
// Charger dotenv uniquement si le fichier .env existe (développement local)
// En production (CapRover), les variables d'environnement sont déjà injectées
require('dotenv').config({ silent: true })

const Hapi = require('@hapi/hapi');
const routes = require('./features/routes/routes');
const HapiCron = require('hapi-cron');

const init = async () => {

  const server = Hapi.server({
    port: process.env.PORT || 4000,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
  });

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
    console.info('Erreur lors du démarrage du serveur', err);
  }
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();