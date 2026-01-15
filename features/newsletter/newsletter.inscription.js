const { getSubscriberByToken, confirmSubscriber } = require('./newsletter.service');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

module.exports = async (request, h) => {
  const { token } = request.query;

  if (!token) {
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter inscription.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: false,
      message: 'Token manquant. Veuillez cliquer sur le lien de confirmation dans votre email.',
      email: null
    });
    return h.response(html).type('text/html').code(400);
  }

  try {
    // Récupérer le subscriber par son token
    const subscriber = await getSubscriberByToken(token);

    if (!subscriber) {
      const template = await fs.promises.readFile(path.join(__dirname, 'newsletter inscription.ejs'), 'utf8');
      const html = ejs.render(template, {
        success: false,
        message: 'Token invalide ou expiré. Veuillez vous réinscrire.',
        email: null
      });
      return h.response(html).type('text/html').code(404);
    }

    // Vérifier si déjà confirmé
    if (subscriber.confirm) {
      const template = await fs.promises.readFile(path.join(__dirname, 'newsletter inscription.ejs'), 'utf8');
      const html = ejs.render(template, {
        success: true,
        message: 'Votre inscription était déjà confirmée.',
        email: subscriber.email
      });
      return h.response(html).type('text/html');
    }

    // Confirmer l'inscription
    const confirmedSubscriber = await confirmSubscriber(token);

    if (confirmedSubscriber) {
      const template = await fs.promises.readFile(path.join(__dirname, 'newsletter inscription.ejs'), 'utf8');
      const html = ejs.render(template, {
        success: true,
        message: 'Votre inscription a été confirmée avec succès !',
        email: confirmedSubscriber.email
      });
      return h.response(html).type('text/html');
    } else {
      throw new Error('Erreur lors de la confirmation');
    }

  } catch (error) {
    console.error('Erreur lors de la confirmation d\'inscription:', error);
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter inscription.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: false,
      message: 'Erreur lors de la confirmation de votre inscription. Veuillez réessayer.',
      email: null
    });
    return h.response(html).type('text/html').code(500);
  }
}