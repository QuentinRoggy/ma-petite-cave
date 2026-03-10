import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import BoxWine from '#models/box_wine'

export default class Wine extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare merchantId: number

  @column()
  declare name: string

  @column()
  declare domain: string | null

  @column()
  declare vintage: number | null

  @column()
  declare color: 'rouge' | 'blanc' | 'rosé' | 'pétillant' | null

  @column()
  declare region: string | null

  @column()
  declare grapes: string | null

  @column()
  declare alcoholDegree: number | null

  @column()
  declare aromas: string[] | null

  @column()
  declare foodPairings: string[] | null

  @column()
  declare guardMin: number | null

  @column()
  declare guardMax: number | null

  @column()
  declare photoUrl: string | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'merchantId' })
  declare merchant: BelongsTo<typeof User>

  @hasMany(() => BoxWine)
  declare boxWines: HasMany<typeof BoxWine>
}
