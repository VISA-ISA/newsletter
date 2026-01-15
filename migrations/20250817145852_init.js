/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    // Table subscribers - compatible avec le schema existant
    .createTable('subscribers', function (table) {
      table.increments('id').primary();
      table.string('email', 191).notNullable().unique();
      table.string('message_id', 256).notNullable();
      table.boolean('confirm').notNullable().defaultTo(false);
      table.datetime('createdAt', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3));
      table.datetime('updatedAt', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3));
      table.string('token', 191).notNullable();
      table.boolean('disabled').notNullable().defaultTo(false);

      // Index pour les performances
      table.index(['token']);
    })
    // Table newsletter - avec id mois/année et indicateur terminé
    .createTable('newsletters', function (table) {
      table.increments('id').primary();
      table.string('newsletter_id').notNullable().unique(); // ex: "2025-08" pour août 2025
      table.boolean('terminated').notNullable().defaultTo(false); // indicateur terminé
      table.timestamps(true, true);
    })
    // Table emails - pour le tracking et les stats
    .createTable('emails', function (table) {
      table.increments('id').primary();
      table.string('newsletter_id').notNullable();
      table.string('subscriber_email', 191).notNullable();
      table.enum('status', ['pending', 'sent', 'failed', 'bounced', 'opened', 'clicked']).notNullable().defaultTo('pending');
      table.datetime('sent_at');
      table.datetime('opened_at');
      table.datetime('clicked_at');
      table.text('error_message');
      table.timestamps(true, true);

      // Index pour les performances
      table.index(['newsletter_id']);
      table.index(['subscriber_email']);
      table.index(['status']);

      // Clés étrangères
      table.foreign('newsletter_id').references('newsletter_id').inTable('newsletters');
      table.foreign('subscriber_email').references('email').inTable('subscribers');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('emails')
    .dropTableIfExists('newsletters')
    .dropTableIfExists('subscribers');
};
