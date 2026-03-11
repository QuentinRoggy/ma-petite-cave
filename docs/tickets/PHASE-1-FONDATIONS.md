# Phase 1 : Fondations

> Durée estimée : Semaine 1
> Objectif : Préparer l'infrastructure pour supporter les deux rôles (caviste/client)

---

## Vue d'ensemble

Cette phase pose les bases techniques du pivot :
- Adapter la base de données pour les nouveaux modèles
- Gérer les rôles utilisateur (merchant vs client)
- Séparer les interfaces (layouts différents)
- Router vers le bon espace après connexion

---

## Tickets

### TICKET-1.1 : Migrations DB - Nouvelles tables

**Priorité :** P0 (bloquant)
**Statut :** [x] Terminé

#### Description
Créer les migrations pour les nouvelles tables du modèle de données.

#### Fichiers à créer
```
packages/api/database/migrations/
├── XXXX_alter_users_add_role.ts
├── XXXX_create_merchant_profiles.ts
├── XXXX_create_subscriptions.ts
├── XXXX_alter_wines_add_merchant_fields.ts
├── XXXX_create_boxes.ts
├── XXXX_create_box_wines.ts
└── XXXX_create_client_wines.ts
```

#### Instructions détaillées

**1. Migration `alter_users_add_role`**
```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('role', 20).notNullable().defaultTo('client')
      table.string('phone', 20).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role')
      table.dropColumn('phone')
    })
  }
}
```

**2. Migration `create_merchant_profiles`**
```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'merchant_profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.string('shop_name', 255).notNullable()
      table.text('address').nullable()
      table.string('phone', 20).nullable()
      table.string('logo_url', 500).nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.unique(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

**3. Migration `create_subscriptions`**
```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('client_id').references('id').inTable('users').onDelete('CASCADE')
      table.uuid('merchant_id').references('id').inTable('users').onDelete('CASCADE')
      table.string('status', 20).defaultTo('active')
      table.string('invite_token', 255).nullable()
      table.timestamp('invite_sent_at').nullable()
      table.timestamp('activated_at').nullable()
      table.text('notes').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.unique(['client_id', 'merchant_id'])
      table.index(['merchant_id'])
      table.index(['client_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

**4. Migration `alter_wines_add_merchant_fields`**
```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wines'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Renommer user_id en merchant_id pour plus de clarté
      table.renameColumn('user_id', 'merchant_id')

      // Supprimer les colonnes qui ne servent plus au catalogue
      table.dropColumn('type') // Plus de cave/wishlist
      table.dropColumn('rating') // Les ratings sont sur client_wines

      // Ajouter les nouveaux champs enrichis
      table.string('region', 255).nullable()
      table.string('grapes', 255).nullable()
      table.decimal('alcohol_degree', 4, 2).nullable()
      table.specificType('aromas', 'text[]').nullable()
      table.specificType('food_pairings', 'text[]').nullable()
      table.integer('guard_min').nullable()
      table.integer('guard_max').nullable()

      // Renommer les colonnes de notes
      table.renameColumn('merchant_notes', 'notes') // Notes générales du vin
      table.dropColumn('personal_notes') // Plus utilisé ici
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('merchant_id', 'user_id')
      table.string('type', 20).defaultTo('cave')
      table.integer('rating').nullable()
      table.dropColumn('region')
      table.dropColumn('grapes')
      table.dropColumn('alcohol_degree')
      table.dropColumn('aromas')
      table.dropColumn('food_pairings')
      table.dropColumn('guard_min')
      table.dropColumn('guard_max')
      table.renameColumn('notes', 'merchant_notes')
      table.text('personal_notes').nullable()
    })
  }
}
```

**5. Migration `create_boxes`**
```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'boxes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('subscription_id').references('id').inTable('subscriptions').onDelete('CASCADE')
      table.string('month', 7).notNullable() // Format: '2025-01'
      table.string('status', 20).defaultTo('draft')
      table.timestamp('sent_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.unique(['subscription_id', 'month'])
      table.index(['subscription_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

**6. Migration `create_box_wines`**
```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'box_wines'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('box_id').references('id').inTable('boxes').onDelete('CASCADE')
      table.uuid('wine_id').references('id').inTable('wines').onDelete('SET NULL').nullable()
      table.text('merchant_notes').nullable() // Notes spécifiques pour ce client
      table.integer('position').defaultTo(1)
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['box_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

**7. Migration `create_client_wines`**
```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'client_wines'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('box_wine_id').references('id').inTable('box_wines').onDelete('CASCADE')
      table.uuid('client_id').references('id').inTable('users').onDelete('CASCADE')
      table.string('status', 20).defaultTo('in_cellar')
      table.integer('rating').nullable()
      table.text('personal_notes').nullable()
      table.timestamp('opened_at').nullable()
      table.timestamp('finished_at').nullable()
      table.boolean('wants_reorder').defaultTo(false)
      table.timestamp('reorder_requested_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.index(['client_id'])
      table.index(['box_wine_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

#### Commandes à exécuter
```bash
# Dans packages/api/
node ace make:migration alter_users_add_role
node ace make:migration create_merchant_profiles
node ace make:migration create_subscriptions
node ace make:migration alter_wines_add_merchant_fields
node ace make:migration create_boxes
node ace make:migration create_box_wines
node ace make:migration create_client_wines

# Puis après avoir rempli les migrations
node ace migration:run
```

#### Critères d'acceptation
- [ ] Toutes les migrations passent sans erreur
- [ ] Les contraintes de clés étrangères sont en place
- [ ] Les index sont créés
- [ ] Le rollback fonctionne

---

### TICKET-1.2 : Modèles Lucid - Nouvelles entités

**Priorité :** P0 (bloquant)
**Statut :** [x] Terminé
**Dépend de :** TICKET-1.1

#### Description
Créer/adapter les modèles Lucid pour les nouvelles entités.

#### Fichiers à créer/modifier
```
packages/api/app/models/
├── user.ts              # Modifier (ajouter role, relations)
├── merchant_profile.ts  # Nouveau
├── subscription.ts      # Nouveau
├── wine.ts              # Modifier (nouveaux champs)
├── box.ts               # Nouveau
├── box_wine.ts          # Nouveau
└── client_wine.ts       # Nouveau
```

#### Instructions détaillées

**1. Modifier `user.ts`**
```typescript
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasOne, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import MerchantProfile from './merchant_profile.js'
import Subscription from './subscription.js'
import Wine from './wine.js'
import ClientWine from './client_wine.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'client' | 'merchant'

  @column()
  declare fullName: string | null

  @column()
  declare phone: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relations Merchant
  @hasOne(() => MerchantProfile)
  declare merchantProfile: HasOne<typeof MerchantProfile>

  @hasMany(() => Wine, { foreignKey: 'merchantId' })
  declare wines: HasMany<typeof Wine>

  @hasMany(() => Subscription, { foreignKey: 'merchantId' })
  declare clientSubscriptions: HasMany<typeof Subscription>

  // Relations Client
  @hasMany(() => Subscription, { foreignKey: 'clientId' })
  declare merchantSubscriptions: HasMany<typeof Subscription>

  @hasMany(() => ClientWine)
  declare clientWines: HasMany<typeof ClientWine>

  // Helpers
  get isMerchant() {
    return this.role === 'merchant'
  }

  get isClient() {
    return this.role === 'client'
  }
}
```

**2. Créer `merchant_profile.ts`**
```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class MerchantProfile extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare shopName: string

  @column()
  declare address: string | null

  @column()
  declare phone: string | null

  @column()
  declare logoUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
```

**3. Créer `subscription.ts`**
```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Box from './box.js'

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare clientId: string

  @column()
  declare merchantId: string

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
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'clientId' })
  declare client: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'merchantId' })
  declare merchant: BelongsTo<typeof User>

  @hasMany(() => Box)
  declare boxes: HasMany<typeof Box>
}
```

**4. Modifier `wine.ts`**
```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import BoxWine from './box_wine.js'

export default class Wine extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare merchantId: string

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
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'merchantId' })
  declare merchant: BelongsTo<typeof User>

  @hasMany(() => BoxWine)
  declare boxWines: HasMany<typeof BoxWine>
}
```

**5. Créer `box.ts`**
```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Subscription from './subscription.js'
import BoxWine from './box_wine.js'

export default class Box extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare subscriptionId: string

  @column()
  declare month: string // Format: '2025-01'

  @column()
  declare status: 'draft' | 'sent'

  @column.dateTime()
  declare sentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>

  @hasMany(() => BoxWine)
  declare boxWines: HasMany<typeof BoxWine>
}
```

**6. Créer `box_wine.ts`**
```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Box from './box.js'
import Wine from './wine.js'
import ClientWine from './client_wine.js'

export default class BoxWine extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare boxId: string

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
```

**7. Créer `client_wine.ts`**
```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BoxWine from './box_wine.js'
import User from './user.js'

export default class ClientWine extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare boxWineId: string

  @column()
  declare clientId: string

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => BoxWine)
  declare boxWine: BelongsTo<typeof BoxWine>

  @belongsTo(() => User, { foreignKey: 'clientId' })
  declare client: BelongsTo<typeof User>
}
```

#### Critères d'acceptation
- [ ] Tous les modèles compilent sans erreur
- [ ] Les relations sont fonctionnelles
- [ ] Les types sont corrects

---

### TICKET-1.3 : Middleware Role Guard

**Priorité :** P0 (bloquant)
**Statut :** [x] Terminé
**Dépend de :** TICKET-1.2

#### Description
Créer un middleware pour restreindre l'accès à certaines routes selon le rôle de l'utilisateur.

#### Fichiers à créer
```
packages/api/app/middleware/
└── role_guard_middleware.ts
```

#### Instructions détaillées

**1. Créer `role_guard_middleware.ts`**
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleGuardMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { roles: ('client' | 'merchant')[] }
  ) {
    const user = ctx.auth.user!

    if (!options.roles.includes(user.role)) {
      return ctx.response.forbidden({
        message: 'Vous n\'avez pas accès à cette ressource',
        error: 'FORBIDDEN_ROLE',
      })
    }

    return next()
  }
}
```

**2. Enregistrer le middleware dans `start/kernel.ts`**
```typescript
router.named({
  // ... existing middlewares
  role: () => import('#middleware/role_guard_middleware'),
})
```

**3. Utilisation dans les routes**
```typescript
// Routes caviste uniquement
router.group(() => {
  router.get('/clients', [ClientsController, 'index'])
  // ...
})
  .prefix('/merchant')
  .middleware([middleware.auth(), middleware.role({ roles: ['merchant'] })])

// Routes client uniquement
router.group(() => {
  router.get('/boxes', [ClientBoxesController, 'index'])
  // ...
})
  .prefix('/client')
  .middleware([middleware.auth(), middleware.role({ roles: ['client'] })])
```

#### Critères d'acceptation
- [ ] Un merchant ne peut pas accéder aux routes `/client/*`
- [ ] Un client ne peut pas accéder aux routes `/merchant/*`
- [ ] Le message d'erreur est clair (403 Forbidden)

---

### TICKET-1.4 : Adapter l'authentification (registration avec rôle)

**Priorité :** P0 (bloquant)
**Statut :** [x] Terminé
**Dépend de :** TICKET-1.2

#### Description
Modifier le système d'inscription pour supporter les deux rôles (client/merchant).

#### Fichiers à modifier
```
packages/api/app/controllers/auth_controller.ts
packages/api/app/validators/auth.ts
```

#### Instructions détaillées

**1. Modifier le validator `auth.ts`**
```typescript
import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8),
    fullName: vine.string().optional(),
    role: vine.enum(['client', 'merchant']).optional(), // Par défaut 'client'
    // Champs optionnels pour merchant
    shopName: vine.string().optional(),
  })
)
```

**2. Modifier `auth_controller.ts`**
```typescript
async register({ request, response }: HttpContext) {
  const data = await request.validateUsing(registerValidator)

  const role = data.role || 'client'

  const user = await User.create({
    email: data.email,
    password: data.password,
    fullName: data.fullName,
    role,
  })

  // Si c'est un merchant, créer aussi son profil
  if (role === 'merchant' && data.shopName) {
    await MerchantProfile.create({
      userId: user.id,
      shopName: data.shopName,
    })
  }

  const token = await User.accessTokens.create(user)

  return response.created({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    token: token.value!.release(),
  })
}
```

**3. Modifier la réponse `/auth/me`**
```typescript
async me({ auth, response }: HttpContext) {
  const user = auth.user!

  // Charger le profil merchant si applicable
  if (user.isMerchant) {
    await user.load('merchantProfile')
  }

  return response.ok({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    merchantProfile: user.isMerchant ? user.merchantProfile : undefined,
  })
}
```

#### Critères d'acceptation
- [ ] On peut créer un compte client (par défaut)
- [ ] On peut créer un compte merchant avec `role: 'merchant'`
- [ ] Le merchant a automatiquement son MerchantProfile créé
- [ ] `/auth/me` retourne le rôle et le profil merchant si applicable

---

### TICKET-1.5 : Layout Merchant (Frontend)

**Priorité :** P1
**Statut :** [x] Terminé
**Dépend de :** TICKET-1.4

#### Description
Créer le layout de l'espace caviste (sidebar, header).

#### Fichiers à créer
```
packages/app/app/(merchant)/
├── layout.tsx
└── components/
    ├── merchant-sidebar.tsx
    └── merchant-header.tsx
```

#### Instructions détaillées

**1. Créer `layout.tsx`**
```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { MerchantSidebar } from './components/merchant-sidebar'
import { MerchantHeader } from './components/merchant-header'

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'merchant') {
    redirect('/cave') // Redirect client vers son espace
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r">
        <MerchantSidebar user={session.user} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <MerchantHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**2. Créer `merchant-sidebar.tsx`**
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Wine,
  Package,
  Settings
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Catalogue', href: '/wines', icon: Wine },
  { name: 'Box', href: '/boxes', icon: Package },
]

export function MerchantSidebar({ user }: { user: any }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo / Shop name */}
      <div className="flex h-16 items-center px-6 border-b">
        <span className="font-semibold text-lg truncate">
          {user.merchantProfile?.shopName || 'Ma Petite Cave'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
          Paramètres
        </Link>
      </div>
    </div>
  )
}
```

**3. Créer `merchant-header.tsx`**
```tsx
'use client'

import { Button } from '@/components/ui/button'
import { LogOut, Menu } from 'lucide-react'
import { logout } from '@/lib/auth'

export function MerchantHeader({ user }: { user: any }) {
  return (
    <header className="flex h-16 items-center justify-between px-6 border-b bg-background">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User info + logout */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user.email}
        </span>
        <form action={logout}>
          <Button variant="ghost" size="icon">
            <LogOut className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </header>
  )
}
```

#### Critères d'acceptation
- [ ] Le layout s'affiche correctement sur desktop
- [ ] La sidebar est cachée sur mobile
- [ ] La navigation est fonctionnelle
- [ ] Le logout fonctionne

---

### TICKET-1.6 : Layout Client (Frontend)

**Priorité :** P1
**Statut :** [x] Terminé
**Dépend de :** TICKET-1.4

#### Description
Créer le layout de l'espace client (bottom navigation, mobile-first).

#### Fichiers à créer
```
packages/app/app/(client)/
├── layout.tsx
└── components/
    ├── client-header.tsx
    └── client-bottom-nav.tsx
```

#### Instructions détaillées

**1. Créer `layout.tsx`**
```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ClientHeader } from './components/client-header'
import { ClientBottomNav } from './components/client-bottom-nav'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'client') {
    redirect('/dashboard') // Redirect merchant vers son espace
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ClientHeader user={session.user} />

      <main className="flex-1 pb-20">
        {children}
      </main>

      <ClientBottomNav />
    </div>
  )
}
```

**2. Créer `client-bottom-nav.tsx`**
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Package, Wine } from 'lucide-react'

const navigation = [
  { name: 'Mes Box', href: '/boxes', icon: Package },
  { name: 'Ma Cave', href: '/cave', icon: Wine },
]

export function ClientBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**3. Créer `client-header.tsx`**
```tsx
'use client'

import { Button } from '@/components/ui/button'
import { LogOut, Settings } from 'lucide-react'
import { logout } from '@/lib/auth'
import Link from 'next/link'

export function ClientHeader({ user }: { user: any }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 border-b bg-background/95 backdrop-blur">
      {/* Logo */}
      <span className="font-semibold">Ma Petite Cave</span>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
        <form action={logout}>
          <Button variant="ghost" size="icon">
            <LogOut className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </header>
  )
}
```

#### Critères d'acceptation
- [ ] Le layout est mobile-first
- [ ] La bottom navigation est fixe
- [ ] Les icônes changent de couleur quand actives
- [ ] Le header est sticky

---

### TICKET-1.7 : Routing par rôle après login

**Priorité :** P1
**Statut :** [x] Terminé
**Dépend de :** TICKET-1.5, TICKET-1.6

#### Description
Après connexion, rediriger l'utilisateur vers le bon espace selon son rôle.

#### Fichiers à modifier
```
packages/app/app/(auth)/login/page.tsx
packages/app/lib/auth.ts
```

#### Instructions détaillées

**1. Modifier la logique de login**
```typescript
// Dans lib/auth.ts ou actions
export async function login(formData: FormData) {
  // ... validation et appel API

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    // ...
  })

  const data = await response.json()

  // Stocker le token
  cookies().set(AUTH_COOKIE_NAME, data.token, { ... })

  // Rediriger selon le rôle
  if (data.user.role === 'merchant') {
    redirect('/dashboard')
  } else {
    redirect('/boxes')
  }
}
```

**2. Page de login avec redirection**
```tsx
// Dans login/page.tsx
export default async function LoginPage() {
  const session = await getSession()

  // Si déjà connecté, rediriger
  if (session) {
    if (session.user.role === 'merchant') {
      redirect('/dashboard')
    } else {
      redirect('/boxes')
    }
  }

  return (
    // ... formulaire de login
  )
}
```

#### Critères d'acceptation
- [ ] Un merchant est redirigé vers `/dashboard` après login
- [ ] Un client est redirigé vers `/boxes` après login
- [ ] Un utilisateur déjà connecté est redirigé automatiquement

---

## Résumé Phase 1

| Ticket | Description | Priorité | Statut |
|--------|-------------|----------|--------|
| 1.1 | Migrations DB | P0 | [x] |
| 1.2 | Modèles Lucid | P0 | [x] |
| 1.3 | Middleware Role Guard | P0 | [x] |
| 1.4 | Auth avec rôle | P0 | [x] |
| 1.5 | Layout Merchant | P1 | [x] |
| 1.6 | Layout Client | P1 | [x] |
| 1.7 | Routing par rôle | P1 | [x] |

**Définition of Done Phase 1 :**
- [x] Toutes les migrations sont passées
- [x] On peut créer un compte merchant et un compte client
- [x] Chaque rôle accède à son propre espace
- [x] Les layouts sont fonctionnels
- [x] Le routing après login est correct

---

## Notes d'implémentation

### Fichiers créés/modifiés

**Backend (API):**
- `database/migrations/1772711809531_create_alter_users_add_roles_table.ts`
- `database/migrations/1772711810467_create_create_merchant_profiles_table.ts`
- `database/migrations/1772711811323_create_create_subscriptions_table.ts`
- `database/migrations/1772711812378_create_alter_wines_for_catalogs_table.ts`
- `database/migrations/1772711813377_create_create_boxes_table.ts`
- `database/migrations/1772711814159_create_create_box_wines_table.ts`
- `database/migrations/1772711814991_create_create_client_wines_table.ts`
- `app/models/user.ts` (modifié)
- `app/models/wine.ts` (modifié)
- `app/models/merchant_profile.ts` (nouveau)
- `app/models/subscription.ts` (nouveau)
- `app/models/box.ts` (nouveau)
- `app/models/box_wine.ts` (nouveau)
- `app/models/client_wine.ts` (nouveau)
- `app/middleware/role_guard_middleware.ts` (nouveau)
- `app/controllers/auth_controller.ts` (modifié)
- `app/controllers/wines_controller.ts` (modifié)
- `app/validators/auth.ts` (modifié)
- `app/validators/wine.ts` (modifié)
- `start/kernel.ts` (modifié)
- `start/routes.ts` (modifié)

**Frontend (App):**
- `app/(merchant)/layout.tsx` (nouveau)
- `app/(merchant)/dashboard/page.tsx` (nouveau)
- `app/(merchant)/clients/page.tsx` (nouveau)
- `app/(merchant)/wines/page.tsx` (nouveau)
- `app/(merchant)/wines/new/page.tsx` (nouveau)
- `app/(merchant)/wines/[id]/page.tsx` (nouveau)
- `app/(merchant)/boxes/page.tsx` (nouveau)
- `app/(client)/layout.tsx` (nouveau)
- `app/(client)/boxes/page.tsx` (nouveau)
- `app/(client)/cave/page.tsx` (nouveau)
- `app/(auth)/login/page.tsx` (modifié)
- `app/(auth)/register/page.tsx` (modifié)
- `app/api/auth/login/route.ts` (modifié - cookie role)
- `app/api/auth/register/route.ts` (modifié - cookie role)
- `app/api/auth/logout/route.ts` (modifié - suppression cookie role)
- `middleware.ts` (modifié - routing par rôle)
- `lib/auth.ts` (modifié - types)
- `lib/types.ts` (modifié - nouveaux types)

**Supprimé:**
- `app/(main)/` (ancien dossier de routes)
- `components/wines/` (anciens composants)
