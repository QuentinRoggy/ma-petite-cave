import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'boxes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('subscription_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('subscriptions')
        .onDelete('CASCADE')
      table.string('month', 7).notNullable() // Format: '2025-01'
      table.string('status', 20).notNullable().defaultTo('draft')
      table.timestamp('sent_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['subscription_id', 'month'])
      table.index(['subscription_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
