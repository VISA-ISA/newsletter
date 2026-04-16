const { getAllSubscribers, disableSubscriber, bulkCreateSubscribers } = require('./newsletter.service');
const { verifyAdmin, getTokenFromRequest } = require('./newsletter.admin.auth');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

/** Filtre recherche (email) + statut pour le tableau admin */
function filterSubscribers (all, q, status) {
  let list = all
  const needle = (q || '').trim().toLowerCase()
  if (needle) {
    list = list.filter((s) => String(s.email).toLowerCase().includes(needle))
  }
  const st = status || 'all'
  if (st !== 'all') {
    list = list.filter((s) => {
      const disabled = Boolean(s.disabled)
      const confirm = Boolean(s.confirm)
      if (st === 'disabled') return disabled
      if (st === 'confirmed') return !disabled && confirm
      if (st === 'pending') return !disabled && !confirm
      return true
    })
  }
  return list
}

function adminListUrl (token, extra = {}) {
  const p = new URLSearchParams()
  p.set('token', token)
  const q = (extra.q || '').trim()
  if (q) p.set('q', q)
  if (extra.status && extra.status !== 'all') p.set('status', extra.status)
  if (extra.success) p.set('success', extra.success)
  if (extra.email != null && extra.email !== '') p.set('email', extra.email)
  if (extra.error) p.set('error', extra.error)
  if (extra.bulk_success != null) p.set('bulk_success', String(extra.bulk_success))
  if (extra.bulk_errors != null) p.set('bulk_errors', String(extra.bulk_errors))
  if (extra.bulk_unsub_success != null) p.set('bulk_unsub_success', String(extra.bulk_unsub_success))
  if (extra.bulk_unsub_errors != null) p.set('bulk_unsub_errors', String(extra.bulk_unsub_errors))
  return `/newsletter/admin?${p.toString()}`
}

// Handler GET - Afficher le dashboard
const getHandler = async (request, h) => {
  // Vérifier l'authentification
  if (!verifyAdmin(request)) {
    return h.redirect('/newsletter/admin/login');
  }

  const allSubscribers = await getAllSubscribers()
  const searchQuery = request.query.q != null ? String(request.query.q) : ''
  const statusFilter = request.query.status != null ? String(request.query.status) : 'all'
  const subscribers = filterSubscribers(allSubscribers, searchQuery, statusFilter)

  const template = await fs.promises.readFile(path.join(__dirname, 'newsletter.admin.dashboard.ejs'), 'utf8');
  const html = ejs.render(template, {
    subscribers,
    subscriberTotal: allSubscribers.length,
    searchQuery,
    statusFilter,
    token: getTokenFromRequest(request),
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

  const { action, email, emails, return_q, return_status } = request.payload;
  const token = getTokenFromRequest(request);
  const filterCtx = { q: return_q, status: return_status };

  // Désinscription individuelle
  if (action === 'unsubscribe' && email) {
    try {
      await disableSubscriber(email);
      return h.redirect(adminListUrl(token, { ...filterCtx, success: 'unsubscribed', email }));
    } catch (error) {
      return h.redirect(adminListUrl(token, { ...filterCtx, error: error.message }));
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

    return h.redirect(adminListUrl(token, { ...filterCtx, bulk_success: successCount, bulk_errors: errorCount }));
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

    return h.redirect(adminListUrl(token, { ...filterCtx, bulk_unsub_success: successCount, bulk_unsub_errors: errorCount }));
  }

  return h.redirect(adminListUrl(token, { ...filterCtx, error: 'Action invalide' }));
};

module.exports = { getHandler, postHandler };
