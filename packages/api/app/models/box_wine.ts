import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Box from '#models/box'
import Wine from '#models/wine'
import ClientWine from '#models/client_wine'

export default class BoxWine extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare boxId: number

  @column()
  declare wineId: string | null

  @column()
  declare merchantNotes: string | null

  @column()
  declare position: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Box)
  declare box: BelongsTo<typeof Box>

  @belongsTo(() => Wine)
  declare wine: BelongsTo<typeof Wine>

  @hasMany(() => ClientWine)
  declare clientWines: HasMany<typeof ClientWine>
}
