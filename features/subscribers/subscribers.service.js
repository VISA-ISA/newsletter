const { knex } = require("../db/db")

const subscribersService = {
  findOrCreateSubscriber: async (email) => {
    const subscriber = await knex('subscribers').where('email', email).first()
    if (!subscriber) {
      await knex('subscribers').insert({ email, created_at: new Date(), updated_at: new Date(), seen_at: new Date() })
    }
    return subscriber
  },
  getSubscribersCount: async () => {
    const count = await knex('subscribers').count('id as count')
    return count[0].count
  },
  blacklistSubscriber: async (email) => {
    await knex('subscribers').where('email', email).update({ disabled: 1, updated_at: new Date() })
  }
}

module.exports = subscribersService