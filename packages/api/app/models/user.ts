import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasOne, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import MerchantProfile from '#models/merchant_profile'
import Subscription from '#models/subscription'
import Wine from '#models/wine'
import ClientWine from '#models/client_wine'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'client' | 'merchant' | 'admin'

  @column()
  declare fullName: string | null

  @column()
  declare phone: string | null

  @column({
    prepare: (value: Record<string, unknown>) => JSON.stringify(value),
    consume: (value: string | Record<string, unknown>) =>
      typeof value === 'string' ? JSON.parse(value) : value ?? {},
  })
  declare preferences: {
    colors?: string[]
    budgetMin?: number
    budgetMax?: number
    regions?: string[]
    aromas?: string[]
    restrictions?: string[]
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasOne(() => MerchantProfile)
  declare merchantProfile: HasOne<typeof MerchantProfile>

  @hasMany(() => Wine, { foreignKey: 'merchantId' })
  declare wines: HasMany<typeof Wine>

  @hasMany(() => Subscription, { foreignKey: 'merchantId' })
  declare clientSubscriptions: HasMany<typeof Subscription>

  @hasMany(() => Subscription, { foreignKey: 'clientId' })
  declare merchantSubscriptions: HasMany<typeof Subscription>

  @hasMany(() => ClientWine, { foreignKey: 'clientId' })
  declare clientWines: HasMany<typeof ClientWine>

  get isMerchant() {
    return this.role === 'merchant'
  }

  get isClient() {
    return this.role === 'client'
  }

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
