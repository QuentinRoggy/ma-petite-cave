import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class NotificationPreference extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare emailFeedback: boolean

  @column()
  declare emailFeedbackFrequency: 'instant' | 'daily' | 'weekly'

  @column()
  declare emailReorder: boolean

  @column()
  declare emailInviteAccepted: boolean

  @column()
  declare emailGuardReminder: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
