const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

module.exports = async (request, h) => {
  try {
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.form.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: false,
      error: null,
      message: null,
      email: null
    });
    return h.response(html).type('text/html');
  } catch (error) {
    console.error('Erreur lors du chargement du formulaire:', error);
    return h.response('Erreur lors du chargement de la page').code(500);
  }
}
