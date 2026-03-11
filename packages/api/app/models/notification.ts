import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare type: 'feedback' | 'reorder' | 'invite_accepted' | 'guard_reminder'

  @column()
  declare title: string

  @column()
  declare body: string | null

  @column({
    prepare: (value: Record<string, unknown>) => JSON.stringify(value),
    consume: (value: string | Record<string, unknown>) =>
      typeof value === 'string' ? JSON.parse(value) : value ?? {},
  })
  declare data: Record<string, unknown>

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime()
  declare emailDigestSentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
