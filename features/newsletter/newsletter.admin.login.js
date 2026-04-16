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

  const adminSecret = process.env.TOKEN_ADMIN

  // Même valeur que le mot de passe : vérifiée côté dashboard (newsletter.admin.auth)
  return h.redirect(`/newsletter/admin?token=${encodeURIComponent(adminSecret)}`).state('admin_token', adminSecret, {
    isSecure: false,
    isHttpOnly: true,
    path: '/',
    ttl: 3600000 // 1 heure
  });
}
