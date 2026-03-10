import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Update the role check constraint to include 'admin'
    this.schema.raw(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check;

      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('client', 'merchant', 'admin'));
    `)
  }

  async down() {
    // Revert to only 'client' and 'merchant'
    this.schema.raw(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check;

      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('client', 'merchant'));
    `)
  }
}
