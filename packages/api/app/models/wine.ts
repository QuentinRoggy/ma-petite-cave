import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Wine extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number

  @column()
  declare type: 'cave' | 'wishlist'

  @column()
  declare name: string

  @column()
  declare domain: string | null

  @column()
  declare vintage: number | null

  @column()
  declare color: 'rouge' | 'blanc' | 'rosé' | 'pétillant' | null

  @column()
  declare merchantNotes: string | null

  @column()
  declare personalNotes: string | null

  @column()
  declare rating: number | null

  @column()
  declare photoUrl: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
