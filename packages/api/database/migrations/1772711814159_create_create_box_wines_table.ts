import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'box_wines'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('box_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('boxes')
        .onDelete('CASCADE')
      table
        .uuid('wine_id')
        .nullable()
        .references('id')
        .inTable('wines')
        .onDelete('SET NULL')
      table.text('merchant_notes').nullable() // Notes spécifiques pour ce client
      table.integer('position').notNullable().defaultTo(1)

      table.timestamp('created_at').notNullable()

      table.index(['box_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
