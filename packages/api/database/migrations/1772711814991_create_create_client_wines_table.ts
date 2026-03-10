import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'client_wines'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('box_wine_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('box_wines')
        .onDelete('CASCADE')
      table
        .integer('client_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('status', 20).notNullable().defaultTo('in_cellar')
      table.smallint('rating').nullable()
      table.text('personal_notes').nullable()
      table.timestamp('opened_at').nullable()
      table.timestamp('finished_at').nullable()
      table.boolean('wants_reorder').notNullable().defaultTo(false)
      table.timestamp('reorder_requested_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['client_id'])
      table.index(['box_wine_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
