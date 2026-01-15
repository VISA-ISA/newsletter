const { disableSubscriber } = require('./newsletter.service');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

module.exports = async (request, h) => {
  const { password, emails } = request.payload;

  console.log(password, emails)

  // Vérification du mot de passe admin
  if (password !== process.env.TOKEN_ADMIN) {
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: false,
      error: 'Mot de passe administrateur incorrect',
      processedEmails: [],
      failedEmails: []
    });
    return h.response(html).type('text/html').code(401);
  }

  if (!emails || emails.trim() === '') {
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: false,
      error: 'Veuillez fournir au moins un email',
      processedEmails: [],
      failedEmails: []
    });
    return h.response(html).type('text/html').code(400);
  }

  try {
    // Parser les emails (un par ligne)
    const emailList = emails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emailList.length === 0) {
      const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.ejs'), 'utf8');
      const html = ejs.render(template, {
        success: false,
        error: 'Aucun email valide trouvé',
        processedEmails: [],
        failedEmails: []
      });
      return h.response(html).type('text/html').code(400);
    }

    const processedEmails = [];
    const failedEmails = [];

    // Traiter chaque email
    for (const email of emailList) {
      try {
        await disableSubscriber(email);
        processedEmails.push(email);
        console.log(`✅ Email désinscrit avec succès: ${email}`);
      } catch (error) {
        failedEmails.push({ email, error: error.message });
        console.error(`❌ Erreur lors de la désinscription de ${email}:`, error.message);
      }
    }

    // Afficher les résultats
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: true,
      error: null,
      processedEmails,
      failedEmails,
      totalProcessed: processedEmails.length,
      totalFailed: failedEmails.length
    });
    return h.response(html).type('text/html');

  } catch (error) {
    console.error('Erreur lors du traitement en lot:', error);
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: false,
      error: 'Erreur lors du traitement: ' + error.message,
      processedEmails: [],
      failedEmails: []
    });
    return h.response(html).type('text/html').code(500);
  }
}
