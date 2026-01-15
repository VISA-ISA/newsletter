const { getAllSubscribers, disableSubscriber, bulkCreateSubscribers } = require('./newsletter.service');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// Vérification simple du token
const verifyAdmin = (request) => {
  const token = request.query.token || request.state?.admin_token;
  // Vérifier que le token existe (dans un vrai système, on vérifierait en base ou avec JWT)
  // Pour l'instant, on accepte n'importe quel token après connexion
  return !!token;
};

// Handler GET - Afficher le dashboard
const getHandler = async (request, h) => {
  // Vérifier l'authentification
  if (!verifyAdmin(request)) {
    return h.redirect('/newsletter/admin/login');
  }

  // Récupérer tous les subscribers
  const subscribers = await getAllSubscribers();

  const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.dashboard.ejs'), 'utf8');
  const html = ejs.render(template, {
    subscribers,
    token: request.query.token,
    success: request.query.success,
    email: request.query.email,
    error: request.query.error,
    bulkSuccess: request.query.bulk_success,
    bulkErrors: request.query.bulk_errors,
    bulkUnsubSuccess: request.query.bulk_unsub_success,
    bulkUnsubErrors: request.query.bulk_unsub_errors
  });
  return h.response(html).type('text/html');
};

// Handler POST - Actions
const postHandler = async (request, h) => {
  // Vérifier l'authentification
  if (!verifyAdmin(request)) {
    return h.response({ error: 'Non autorisé' }).code(401);
  }

  const { action, email, emails } = request.payload;
  const token = request.query.token;

  // Désinscription individuelle
  if (action === 'unsubscribe' && email) {
    try {
      await disableSubscriber(email);
      return h.redirect(`/newsletter/admin?token=${token}&success=unsubscribed&email=${encodeURIComponent(email)}`);
    } catch (error) {
      return h.redirect(`/newsletter/admin?token=${token}&error=${encodeURIComponent(error.message)}`);
    }
  }

  // Inscription en lot
  if (action === 'bulk_subscribe' && emails) {
    const emailList = emails
      .split('\n')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    const results = await bulkCreateSubscribers(emailList);
    const successCount = results.filter(r => r.status === 'created' || r.status === 'updated').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return h.redirect(`/newsletter/admin?token=${token}&bulk_success=${successCount}&bulk_errors=${errorCount}`);
  }

  // Désinscription en lot
  if (action === 'bulk_unsubscribe' && emails) {
    const emailList = emails
      .split('\n')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    let successCount = 0;
    let errorCount = 0;

    for (const email of emailList) {
      try {
        await disableSubscriber(email);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Erreur lors de la désinscription de ${email}:`, error.message);
      }
    }

    return h.redirect(`/newsletter/admin?token=${token}&bulk_unsub_success=${successCount}&bulk_unsub_errors=${errorCount}`);
  }

  return h.redirect(`/newsletter/admin?token=${token}&error=Action invalide`);
};

module.exports = { getHandler, postHandler };
