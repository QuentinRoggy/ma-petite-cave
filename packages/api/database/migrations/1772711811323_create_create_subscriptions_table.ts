import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('client_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('merchant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('status', 20).notNullable().defaultTo('active')
      table.string('invite_token', 255).nullable()
      table.timestamp('invite_sent_at').nullable()
      table.timestamp('activated_at').nullable()
      table.text('notes').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['client_id', 'merchant_id'])
      table.index(['merchant_id'])
      table.index(['client_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
