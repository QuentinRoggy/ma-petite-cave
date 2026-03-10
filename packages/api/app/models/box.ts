import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Subscription from '#models/subscription'
import BoxWine from '#models/box_wine'

export default class Box extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare subscriptionId: number

  @column()
  declare month: string // Format: '2025-01'

  @column()
  declare status: 'draft' | 'sent'

  @column.dateTime()
  declare sentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>

  @hasMany(() => BoxWine)
  declare boxWines: HasMany<typeof BoxWine>
}
