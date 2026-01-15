const { getSubscriberByToken, disableSubscriber } = require('./newsletter.service');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

module.exports = async (request, h) => {
  const { token } = request.query;

  if (!token) {
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter desinscription.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: false,
      message: 'Token manquant',
      email: null
    });
    return h.response(html).type('text/html').code(400);
  }


  try {
    // Récupérer le subscriber par son token
    const subscriber = await getSubscriberByToken(token);

    if (!subscriber) {
      const template = await fs.promises.readFile(path.join(__dirname, 'newsletter desinscription.ejs'), 'utf8');
      const html = ejs.render(template, {
        success: false,
        message: 'Token invalide ou expiré',
        email: null
      });
      return h.response(html).type('text/html').code(404);
    }

    // Désactiver le subscriber
    await disableSubscriber(subscriber.email);

    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter desinscription.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: true,
      message: 'Vous avez été désinscrit de la newsletter avec succès.',
      email: subscriber.email
    });
    return h.response(html).type('text/html');

  } catch (error) {
    console.error('Erreur lors de la désinscription:', error);
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter desinscription.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: false,
      message: 'Erreur lors de la désinscription',
      email: null
    });
    return h.response(html).type('text/html').code(500);
  }
}