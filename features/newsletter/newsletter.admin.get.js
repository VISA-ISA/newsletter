const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

module.exports = async (request, h) => {
  try {
    const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.ejs'), 'utf8');
    const html = ejs.render(template, {
      success: false,
      error: null,
      processedEmails: [],
      failedEmails: [],
      totalProcessed: 0,
      totalFailed: 0
    });
    return h.response(html).type('text/html');
  } catch (error) {
    console.error('Erreur lors du chargement de la page admin:', error);
    return h.response('Erreur lors du chargement de la page').code(500);
  }
}
