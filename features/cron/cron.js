const notif = require('../notif/notif');

module.exports = [{
  name: 'clean-sticky-posts',
  time: '0 * * * *', // Toutes les heures
  timezone: 'Europe/Paris',
  request: {
    method: 'POST',
    url: '/clean-sticky-posts',
    headers: {
      'Authorization': `${process.env.CRON_TOKEN}`,
    },
  },
  onError: (err) => {
    notif(
      `❌ Erreur lors du nettoyage des articles épinglés :
        :warning: ${err}`
    )
  },
},
{
  name: 'newsletter-13h',
  time: '0 13 * * *',
  timezone: 'Europe/Paris',
  request: {
    method: 'POST',
    url: '/',
    headers: {
      'Authorization': `${process.env.CRON_TOKEN}`,
    },
  },
  onError: (err) => {
    notif(
      `❌ Erreur lors de l'envoi de la newsletter (13h) :
        :warning: ${err}`
    )
  },
},
{
  name: 'newsletter-15h',
  time: '0 15 * * *',
  timezone: 'Europe/Paris',
  request: {
    method: 'POST',
    url: '/',
    headers: {
      'Authorization': `${process.env.CRON_TOKEN}`,
    },
  },
  onError: (err) => {
    notif(
      `❌ Erreur lors de l'envoi de la newsletter (15h) :
        :warning: ${err}`
    )
  },
},
{
  name: 'newsletter-17h',
  time: '0 17 * * *',
  timezone: 'Europe/Paris',
  request: {
    method: 'POST',
    url: '/',
    headers: {
      'Authorization': `${process.env.CRON_TOKEN}`,
    },
  },
  onError: (err) => {
    notif(
      `❌ Erreur lors de l'envoi de la newsletter (17h) :
        :warning: ${err}`
    )
  },
}]