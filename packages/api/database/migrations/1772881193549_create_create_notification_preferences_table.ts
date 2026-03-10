import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notification_preferences'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').unique().notNullable()
      table.boolean('email_feedback').defaultTo(true)
      table.string('email_feedback_frequency', 20).defaultTo('daily')
      table.boolean('email_reorder').defaultTo(true)
      table.boolean('email_invite_accepted').defaultTo(true)
      table.boolean('email_guard_reminder').defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
