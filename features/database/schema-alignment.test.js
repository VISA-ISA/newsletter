const assert = require('node:assert/strict')
const { afterEach, test } = require('node:test')

const dbPath = require.resolve('../db/db')
const newsletterServicePath = require.resolve('../newsletter/newsletter.service')
const subscribersServicePath = require.resolve('../subscribers/subscribers.service')
const originalDbModule = require.cache[dbPath]

function loadServicesWithKnex (knex) {
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { knex }
  }
  delete require.cache[newsletterServicePath]
  delete require.cache[subscribersServicePath]

  return {
    newsletterService: require('../newsletter/newsletter.service'),
    subscribersService: require('../subscribers/subscribers.service')
  }
}

function restoreModules () {
  if (originalDbModule) require.cache[dbPath] = originalDbModule
  else delete require.cache[dbPath]
  delete require.cache[newsletterServicePath]
  delete require.cache[subscribersServicePath]
}

afterEach(restoreModules)

function createKnexSpy () {
  const operations = []
  const knex = (table) => {
    const query = {
      where: () => query,
      first: async () => undefined,
      insert: async (values) => operations.push({ type: 'insert', table, values }),
      update: async (values) => operations.push({ type: 'update', table, values })
    }
    return query
  }
  return { knex, operations }
}

test('uses snake_case timestamps for emails', async () => {
  const { knex, operations } = createKnexSpy()
  const { newsletterService } = loadServicesWithKnex(knex)

  await newsletterService.insertEmail('2026-10', { email: 'test@example.org' })
  await newsletterService.updateEmail('2026-10', 'test@example.org', { status: 'delivered' })

  assert.deepEqual(Object.keys(operations[0].values).sort(), ['created_at', 'newsletter_id', 'status', 'subscriber_email', 'updated_at'])
  assert.equal(operations[1].values.updated_at instanceof Date, true)
  assert.equal('updatedAt' in operations[1].values, false)
})

test('uses camelCase timestamps and no absent seen_at column for subscribers', async () => {
  const { knex, operations } = createKnexSpy()
  const { subscribersService } = loadServicesWithKnex(knex)

  await subscribersService.findOrCreateSubscriber('test@example.org')

  assert.deepEqual(Object.keys(operations[0].values).sort(), ['createdAt', 'email', 'updatedAt'])
  assert.equal('seen_at' in operations[0].values, false)
})
