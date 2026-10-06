const { knex } = require("../db/db")

const subscribersService = {
  findOrCreateSubscriber: async (email) => {
    const subscriber = await knex('subscribers').where('email', email).first()
    if (!subscriber) {
      await knex('subscribers').insert({ email, createdAt: new Date(), updatedAt: new Date() })
    }
    return subscriber
  },
  getSubscribersCount: async () => {
    const count = await knex('subscribers').count('id as count')
    return count[0].count
  },
  blacklistSubscriber: async (email) => {
    await knex('subscribers').where('email', email).update({ disabled: 1, updatedAt: new Date() })
  }
}

module.exports = subscribersService
