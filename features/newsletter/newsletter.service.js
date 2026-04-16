const { knex } = require("../db/db")

/**
 * Dernier segment du domaine : rejette les suffixes corrompus type gmail.com3Fod (TLD « com3Fod »).
 * Les TLD ASCII usuels sont alphabétiques ; les TLD IDN sont en punycode (xn--…).
 * Les domaines custom (ex. mail.entreprise.fr) restent valides si le TLD est une étiquette lettres-only ou punycode.
 */
function isValidTldLabel (tld) {
  if (!tld || tld.length > 63) return false
  if (/^xn--/i.test(tld)) {
    return /^xn--[a-z0-9-]{1,59}$/i.test(tld) && tld.length >= 4
  }
  if (tld.length < 2) return false
  return /^[a-z]+$/i.test(tld)
}

/** Format d’email exploitable pour l’envoi (RFC simplifiée, longueur raisonnable). */
function isValidEmail (email) {
  if (typeof email !== 'string') return false
  const trimmed = email.trim()
  if (trimmed.length < 5 || trimmed.length > 254) return false

  const at = trimmed.lastIndexOf('@')
  if (at <= 0 || at >= trimmed.length - 1) return false

  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  if (!local.length || local.length > 64) return false
  if (!domain.length || domain.length > 253) return false
  if (!domain.includes('.')) return false

  const labels = domain.split('.')
  if (labels.length < 2) return false
  if (labels.some((l) => !l || l.length > 63)) return false

  if (!isValidTldLabel(labels[labels.length - 1])) return false

  if (!/^[^\s@]+$/.test(local)) return false
  if (!/^[^\s@]+$/.test(domain)) return false

  return true
}

const newsletterService = {
  isValidEmail,
  findOrCreateNewsletter: async (newsletter_id) => {
    const newsletter = await knex('newsletters').where('newsletter_id', newsletter_id).first()

    if (!newsletter) {
      await knex('newsletters').insert({ newsletter_id })
      return newsletterService.findOrCreateNewsletter(newsletter_id)
    }
    return newsletter
  },
  getEmailsCount: async (newsletter_id) => {
    const count = await knex('emails').where('newsletter_id', newsletter_id).count('id as count')
    return count[0].count
  },
  getEmailsStats: async (newsletter_id) => {
    const stats = await knex('emails').where('newsletter_id', newsletter_id).select(knex.raw('COUNT(*) as total'), knex.raw('COUNT(CASE WHEN status = "delivered" THEN 1 END) as delivered'), knex.raw('COUNT(CASE WHEN status = "opened" THEN 1 END) as opened'), knex.raw('COUNT(CASE WHEN status = "clicked" THEN 1 END) as clicked'))
    return stats[0]
  },
  getSubscribersForSend: async (newsletter_id, limit = 250) => {
    const subscribers = await knex('subscribers')
      .where('disabled', 0)
      .where('confirm', 1)
      .whereNotExists(function () {
        this.select('id', 'email')
          .from('emails')
          .whereRaw('emails.subscriber_email = subscribers.email')
          .where('emails.newsletter_id', newsletter_id)
      })
      .select('email', 'token')
      .limit(limit)

    return subscribers
  },
  closeNewsletter: async (newsletter_id) => {
    await knex('newsletters').where('newsletter_id', newsletter_id).update({ terminated: 1, updated_at: new Date() })
  },
  insertEmails: async (newsletter_id, to) => {
    await knex('emails').insert(to.map(subscriber => ({
      newsletter_id,
      subscriber_email: subscriber.email,
      status: 'sent',
      created_at: new Date(),
      updated_at: new Date(),
    })))
  },
  updateEmail: async (newsletter_id, email, payload) => {
    await knex('emails').where('newsletter_id', newsletter_id).where('subscriber_email', email).update({ ...payload, updated_at: new Date() })
  },
  getSubscriberByToken: async (token) => {
    return await knex('subscribers').where('token', token).first()
  },
  updateSubscriberToken: async (email, token) => {
    await knex('subscribers').where('email', email).update({ token, updatedAt: new Date() })
  },
  disableSubscriber: async (email) => {
    await knex('subscribers').where('email', email).update({ disabled: 1, confirm: 0, updatedAt: new Date() })
  },
  /** Suppression définitive (emails liés puis ligne subscriber — contraintes FK). */
  deleteSubscriber: async (email) => {
    if (!email) return
    await knex('emails').where('subscriber_email', email).del()
    await knex('subscribers').where('email', email).del()
  },
  confirmSubscriber: async (token) => {
    const subscriber = await knex('subscribers').where('token', token).first()
    if (subscriber) {
      await knex('subscribers').where('token', token).update({ confirm: 1, updatedAt: new Date() })
      return subscriber
    }
    return null
  },
  createSubscriber: async (email) => {
    const crypto = require('crypto')
    const normalizedEmail = String(email || '').trim()
    const token = crypto.randomBytes(32).toString('hex')
    const message_id = crypto.randomBytes(16).toString('hex')

    const subscriber = await knex('subscribers').where('email', normalizedEmail).first()
    if (subscriber) {
      // Mettre à jour le token si l'utilisateur existe déjà
      await knex('subscribers').where('email', normalizedEmail).update({
        token,
        message_id,
        confirm: 0,
        disabled: 0,
        updatedAt: new Date()
      })
      return { ...subscriber, email: normalizedEmail, token, message_id }
    } else {
      // Créer un nouveau subscriber
      const [id] = await knex('subscribers').insert({
        email: normalizedEmail,
        token,
        message_id,
        confirm: 0,
        disabled: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return { id, email: normalizedEmail, token, message_id, confirm: 0, disabled: 0 }
    }
  },
  getAllSubscribers: async () => {
    return await knex('subscribers')
      .select('id', 'email', 'confirm', 'disabled', 'createdAt', 'updatedAt')
      .orderBy('createdAt', 'desc')
  },
  bulkCreateSubscribers: async (emails) => {
    const crypto = require('crypto')
    const results = []

    for (const email of emails) {
      const trimmedEmail = email.trim()
      if (!trimmedEmail || !trimmedEmail.includes('@')) continue

      try {
        const token = crypto.randomBytes(32).toString('hex')
        const message_id = crypto.randomBytes(16).toString('hex')

        const existing = await knex('subscribers').where('email', trimmedEmail).first()
        if (existing) {
          await knex('subscribers').where('email', trimmedEmail).update({
            token,
            message_id,
            confirm: 0,
            disabled: 0,
            updatedAt: new Date()
          })
          results.push({ email: trimmedEmail, status: 'updated' })
        } else {
          await knex('subscribers').insert({
            email: trimmedEmail,
            token,
            message_id,
            confirm: 0,
            disabled: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          results.push({ email: trimmedEmail, status: 'created' })
        }
      } catch (error) {
        results.push({ email: trimmedEmail, status: 'error', error: error.message })
      }
    }

    return results
  }
}

module.exports = newsletterService