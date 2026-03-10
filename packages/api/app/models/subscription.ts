import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Box from '#models/box'

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare clientId: number

  @column()
  declare merchantId: number

  @column()
  declare status: 'pending_invite' | 'active' | 'paused' | 'cancelled'

  @column()
  declare inviteToken: string | null

  @column.dateTime()
  declare inviteSentAt: DateTime | null

  @column.dateTime()
  declare activatedAt: DateTime | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'clientId' })
  declare subscriber: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'merchantId' })
  declare merchant: BelongsTo<typeof User>

  @hasMany(() => Box)
  declare boxes: HasMany<typeof Box>
}
