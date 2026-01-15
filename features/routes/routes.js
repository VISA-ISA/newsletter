const newsletterRoutes = require('../newsletter/newsletter.routes');
const articlesRoutes = require('../articles/articles.routes');
const brevoRoutes = require('../mail/brevo.routes');

module.exports = [
  ...newsletterRoutes,
  ...articlesRoutes,
  ...brevoRoutes,
]