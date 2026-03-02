import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wines'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('type', 20).notNullable().defaultTo('cave').after('user_id')
      table.dropIndex(['user_id', 'created_at'])
      table.index(['user_id', 'type', 'created_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['user_id', 'type', 'created_at'])
      table.index(['user_id', 'created_at'])
      table.dropColumn('type')
    })
  }
}
