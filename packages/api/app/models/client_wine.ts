import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BoxWine from '#models/box_wine'
import User from '#models/user'

export default class ClientWine extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare boxWineId: number

  @column()
  declare clientId: number

  @column()
  declare status: 'in_cellar' | 'opened' | 'finished'

  @column()
  declare rating: number | null

  @column()
  declare personalNotes: string | null

  @column.dateTime()
  declare openedAt: DateTime | null

  @column.dateTime()
  declare finishedAt: DateTime | null

  @column()
  declare wantsReorder: boolean

  @column.dateTime()
  declare reorderRequestedAt: DateTime | null

  @column.dateTime()
  declare guardReminderSentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => BoxWine)
  declare boxWine: BelongsTo<typeof BoxWine>

  @belongsTo(() => User, { foreignKey: 'clientId' })
  declare client: BelongsTo<typeof User>
}
