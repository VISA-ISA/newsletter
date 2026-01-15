const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

module.exports = async (request, h) => {
  const { password } = request.payload || {};

  // Si pas de mot de passe, afficher le formulaire
  if (!password) {
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.login.ejs'), 'utf8');
    const html = ejs.render(template, {
      error: null
    });
    return h.response(html).type('text/html');
  }

  // Vérification du mot de passe
  if (password !== process.env.TOKEN_ADMIN) {
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.login.ejs'), 'utf8');
    const html = ejs.render(template, {
      error: 'Mot de passe administrateur incorrect'
    });
    return h.response(html).type('text/html').code(401);
  }

  // Générer un token de session simple (hash du mot de passe + timestamp)
  const crypto = require('crypto');
  const timestamp = Date.now();
  const sessionToken = crypto.createHash('sha256').update(process.env.TOKEN_ADMIN + timestamp).digest('hex');

  // Rediriger vers la page admin avec le token
  return h.redirect(`/newsletter/admin?token=${sessionToken}`).state('admin_token', sessionToken, {
    isSecure: false,
    isHttpOnly: true,
    path: '/',
    ttl: 3600000 // 1 heure
  });
}
