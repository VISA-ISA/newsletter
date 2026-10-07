const assert = require('node:assert/strict')
const { afterEach, test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')

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

test('migration permits the delivered status emitted by Brevo', async () => {
  const migration = require('../../migrations/20261007152000_add_delivered_status_to_emails')
  const operations = []
  const column = {
    notNullable: () => column,
    defaultTo: (value) => {
      operations.push({ type: 'defaultTo', value })
      return column
    },
    alter: () => operations.push({ type: 'alter' })
  }
  const knex = {
    schema: {
      alterTable: (tableName, callback) => {
        operations.push({ type: 'alterTable', tableName })
        callback({ enum: (name, values) => {
          operations.push({ type: 'enum', name, values })
          return column
        } })
      }
    }
  }

  await migration.up(knex)

  assert.deepEqual(operations[1], {
    type: 'enum',
    name: 'status',
    values: ['pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked']
  })
  assert.deepEqual(operations.at(-1), { type: 'alter' })
})

test('production container applies migrations before starting the server', () => {
  const root = path.resolve(__dirname, '../..')
  const packageJson = require('../../package.json')
  const dockerfile = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8')

  assert.equal(packageJson.packageManager, 'yarn@4.13.0')
  assert.equal(packageJson.scripts['migrate:production'], 'knex migrate:latest --env production')
  assert.equal(packageJson.scripts['start:production'], 'knex migrate:latest --env production && node server.js')
  assert.match(dockerfile, /corepack enable/)
  assert.match(dockerfile, /yarn install --immutable --mode=skip-build/)
  assert.match(dockerfile, /CMD \["yarn", "start:production"\]/)
})

test('uses camelCase timestamps and no absent seen_at column for subscribers', async () => {
  const { knex, operations } = createKnexSpy()
  const { subscribersService } = loadServicesWithKnex(knex)

  await subscribersService.findOrCreateSubscriber('test@example.org')

  assert.deepEqual(Object.keys(operations[0].values).sort(), ['createdAt', 'email', 'updatedAt'])
  assert.equal('seen_at' in operations[0].values, false)
})
