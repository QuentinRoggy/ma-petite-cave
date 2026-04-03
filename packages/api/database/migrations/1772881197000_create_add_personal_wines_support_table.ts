import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('wines', (table) => {
      table.integer('merchant_id').unsigned().nullable().alter()
    })

    this.schema.alterTable('client_wines', (table) => {
      table.integer('box_wine_id').unsigned().nullable().alter()

      table
        .uuid('wine_id')
        .nullable()
        .references('id')
        .inTable('wines')
        .onDelete('CASCADE')

      table.string('source', 20).notNullable().defaultTo('box')

      table.index(['wine_id'])
    })
  }

  async down() {
    this.schema.alterTable('client_wines', (table) => {
      table.dropIndex(['wine_id'])
      table.dropColumn('source')
      table.dropColumn('wine_id')
      table.integer('box_wine_id').unsigned().notNullable().alter()
    })

    this.schema.alterTable('wines', (table) => {
      table.integer('merchant_id').unsigned().notNullable().alter()
    })
  }
}
