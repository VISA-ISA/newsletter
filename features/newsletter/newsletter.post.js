const crypto = require('crypto')
const authCron = require('../cron/cron.auth')
const sendMail = require('../mail/brevo')
const Newsletter = require('./newsletter')
const notif = require('../notif/notif')
const { findOrCreateNewsletter, getSubscribersForSend, closeNewsletter, insertEmails, getEmailsCount, getEmailsStats, updateSubscriberToken } = require('./newsletter.service')
const { getSubscribersCount } = require('../subscribers/subscribers.service')

module.exports = async (request, h) => {
  await authCron(request, h)


  const LIMIT = 95

  const now = new Date()
  const monthName = now.toLocaleString('fr-FR', { month: 'long' })
  const year = now.getFullYear()
  const subject = `Newsletter VISA pour ${monthName} ${year}`
  const newsletter_id = subject

  const newsletter = await findOrCreateNewsletter(newsletter_id)
  const totalSubscribers = await getSubscribersCount(newsletter_id)

  const stats = await getEmailsStats(newsletter_id)

  if (newsletter.terminated) {
    return h.response('Newsletter already terminated', 200)
  }

  const to = await getSubscribersForSend(newsletter_id, LIMIT)

  if (to.length < LIMIT) {
    await closeNewsletter(newsletter_id)
  }

  if (to.length > 0) {
    try {
      // Préparer les subscribers avec leurs nouveaux tokens
      const subscribersWithTokens = []

      for (const subscriber of to) {
        // Générer un nouveau token
        const newToken = crypto.randomBytes(32).toString('hex')

        // Mettre à jour le token du subscriber en base
        await updateSubscriberToken(subscriber.email, newToken)

        // Ajouter le subscriber avec son nouveau token
        subscribersWithTokens.push({
          ...subscriber,
          token: newToken
        })
      }

      // Envoyer les emails avec les nouveaux tokens
      for (const subscriber of subscribersWithTokens) {
        const htmlContent = await Newsletter({
          token: subscriber.token,
          email: subscriber.email
        })

        await sendMail({
          to: [subscriber],
          subject,
          htmlContent,
        })
      }

      // Enregistrer tous les emails
      await insertEmails(newsletter_id, to)

    } catch (error) {
      console.log(error)
      return h.response(error?.message || error, error?.code || 500)
    }

  }

  const totalSent = await getEmailsCount(newsletter_id)

  notif(`## ${newsletter_id}
    **Status**: ${newsletter.terminated ? 'Terminé' : 'En cours'}
    **Abonnés**: ${totalSubscribers}
    **Stats**: ${stats.total} envoyés, ${stats.delivered} livrés, ${stats.opened} ouverts, ${stats.clicked} cliqués
    ${newsletter.terminated
      ? `**Non envoyés**: ${totalSubscribers - totalSent} (${Math.round((totalSubscribers - totalSent) / totalSubscribers * 100)}%)`
      : `**Progression**: ${totalSent} envoyés (${Math.round((totalSent / totalSubscribers) * 100)}%)`
    }`)

  return h.response(`OK ${totalSubscribers}`)
}