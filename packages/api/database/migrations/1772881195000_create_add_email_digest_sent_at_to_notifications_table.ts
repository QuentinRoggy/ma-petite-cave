import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('email_digest_sent_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_digest_sent_at')
    })
  }
}
