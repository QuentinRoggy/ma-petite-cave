import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'client_wines'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('guard_reminder_sent_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('guard_reminder_sent_at')
    })
  }
}
