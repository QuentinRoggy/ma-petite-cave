import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wines'

  async up() {
    // D'abord supprimer l'ancien index (avant de renommer les colonnes)
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['user_id', 'type', 'created_at'])
    })

    this.schema.alterTable(this.tableName, (table) => {
      // Renommer user_id en merchant_id
      table.renameColumn('user_id', 'merchant_id')

      // Supprimer les colonnes qui ne sont plus utilisées pour le catalogue
      table.dropColumn('type')
      table.dropColumn('rating')
      table.dropColumn('personal_notes')

      // Rendre photo_url nullable (pas toujours requis pour le catalogue)
      table.text('photo_url').nullable().alter()

      // Renommer merchant_notes en notes (notes générales du vin)
      table.renameColumn('merchant_notes', 'notes')

      // Ajouter les nouveaux champs enrichis
      table.string('region', 255).nullable()
      table.string('grapes', 255).nullable()
      table.decimal('alcohol_degree', 4, 2).nullable()
      table.specificType('aromas', 'text[]').nullable()
      table.specificType('food_pairings', 'text[]').nullable()
      table.integer('guard_min').nullable()
      table.integer('guard_max').nullable()

      // Créer le nouvel index
      table.index(['merchant_id', 'created_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['merchant_id', 'created_at'])
    })

    this.schema.alterTable(this.tableName, (table) => {
      // Restaurer les colonnes supprimées
      table.string('type', 20).notNullable().defaultTo('cave')
      table.smallint('rating').nullable()
      table.text('personal_notes').nullable()

      // Restaurer photo_url comme not null
      table.text('photo_url').notNullable().alter()

      // Renommer les colonnes
      table.renameColumn('notes', 'merchant_notes')
      table.renameColumn('merchant_id', 'user_id')

      // Supprimer les nouveaux champs
      table.dropColumn('region')
      table.dropColumn('grapes')
      table.dropColumn('alcohol_degree')
      table.dropColumn('aromas')
      table.dropColumn('food_pairings')
      table.dropColumn('guard_min')
      table.dropColumn('guard_max')

      // Restaurer l'ancien index
      table.index(['user_id', 'type', 'created_at'])
    })
  }
}
