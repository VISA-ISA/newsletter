/**
 * Adds the status emitted by Brevo's `delivered` webhook.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('emails', function (table) {
    table
      .enum('status', ['pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked'])
      .notNullable()
      .defaultTo('pending')
      .alter()
  })
}

/**
 * A MySQL ENUM cannot remove a value while rows still use it.  `sent` is the
 * closest pre-migration state, so normalise delivered rows before rollback.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('emails').where('status', 'delivered').update({ status: 'sent' })

  return knex.schema.alterTable('emails', function (table) {
    table
      .enum('status', ['pending', 'sent', 'failed', 'bounced', 'opened', 'clicked'])
      .notNullable()
      .defaultTo('pending')
      .alter()
  })
}
