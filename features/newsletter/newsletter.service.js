const { knex } = require("../db/db")

const newsletterService = {
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
    const token = crypto.randomBytes(32).toString('hex')
    const message_id = crypto.randomBytes(16).toString('hex')

    const subscriber = await knex('subscribers').where('email', email).first()
    if (subscriber) {
      // Mettre à jour le token si l'utilisateur existe déjà
      await knex('subscribers').where('email', email).update({
        token,
        message_id,
        confirm: 0,
        disabled: 0,
        updatedAt: new Date()
      })
      return { ...subscriber, token, message_id }
    } else {
      // Créer un nouveau subscriber
      const [id] = await knex('subscribers').insert({
        email,
        token,
        message_id,
        confirm: 0,
        disabled: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return { id, email, token, message_id, confirm: 0, disabled: 0 }
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