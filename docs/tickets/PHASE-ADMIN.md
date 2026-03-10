# Phase Admin : Backoffice Administrateur

> Durée estimée : 2-3 semaines
> Objectif : Interface d'administration pour gérer la plateforme

---

## Vue d'ensemble

Le backoffice admin permet de :
- Gérer tous les utilisateurs (merchants et clients)
- Créer et gérer les relations client-caviste
- Préparer des démos rapidement
- Monitorer l'activité de la plateforme
- Débugger et supporter les utilisateurs

---

## Prérequis

### Nouveau rôle : admin

```typescript
// Types
type UserRole = 'client' | 'merchant' | 'admin'

// Un admin peut tout faire, il n'est pas lié à un merchant spécifique
```

### Sécurité
- L'accès admin est restreint aux comptes avec `role = 'admin'`
- Les actions sensibles sont loggées
- Pas de création de compte admin via l'interface publique

---

## Tickets

### TICKET-ADMIN-1 : Infrastructure Admin

**Priorité :** P0 (bloquant)
**Statut :** [x] Terminé
**Effort :** Moyen

#### Description
Mettre en place l'infrastructure de base pour la partie admin.

#### 1. Migration : Ajouter le rôle admin

```typescript
// database/migrations/xxx_add_admin_role.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check;

      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('client', 'merchant', 'admin'));
    `)
  }

  async down() {
    this.schema.raw(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check;

      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('client', 'merchant'));
    `)
  }
}
```

#### 2. Middleware admin

```typescript
// app/middleware/admin_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user

    if (!user || user.role !== 'admin') {
      return response.forbidden({ error: 'Admin access required' })
    }

    await next()
  }
}
```

#### 3. Routes admin

```typescript
// start/routes.ts
const AdminUsersController = () => import('#controllers/admin/users_controller')
const AdminSubscriptionsController = () => import('#controllers/admin/subscriptions_controller')
const AdminStatsController = () => import('#controllers/admin/stats_controller')
const AdminDemoController = () => import('#controllers/admin/demo_controller')

router
  .group(() => {
    // Stats
    router.get('stats', [AdminStatsController, 'index'])

    // Users
    router.get('users', [AdminUsersController, 'index'])
    router.post('users', [AdminUsersController, 'store'])
    router.get('users/:id', [AdminUsersController, 'show'])
    router.patch('users/:id', [AdminUsersController, 'update'])
    router.delete('users/:id', [AdminUsersController, 'destroy'])
    router.post('users/:id/impersonate', [AdminUsersController, 'impersonate'])

    // Subscriptions
    router.get('subscriptions', [AdminSubscriptionsController, 'index'])
    router.post('subscriptions', [AdminSubscriptionsController, 'store'])
    router.delete('subscriptions/:id', [AdminSubscriptionsController, 'destroy'])

    // Demo tools
    router.post('demo/setup', [AdminDemoController, 'setup'])
    router.post('demo/reset', [AdminDemoController, 'reset'])
  })
  .prefix('admin')
  .use([middleware.auth(), middleware.admin()])
```

#### 4. Layout admin (Frontend)

```
packages/app/app/(admin)/
├── layout.tsx
├── dashboard/
│   └── page.tsx
├── users/
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   └── [id]/
│       └── page.tsx
├── subscriptions/
│   └── page.tsx
└── demo/
    └── page.tsx
```

#### Layout admin
```tsx
// app/(admin)/layout.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Link2,
  Beaker,
  LogOut,
  Shield,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Abonnements', href: '/admin/subscriptions', icon: Link2 },
  { name: 'Démo', href: '/admin/demo', icon: Beaker },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 px-6 border-b border-zinc-800">
            <Shield className="h-6 w-6 text-red-500" />
            <span className="font-semibold text-lg">Admin</span>
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
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white w-full"
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 bg-zinc-50">
        {children}
      </main>
    </div>
  )
}
```

#### 5. Redirection par rôle

Modifier la logique de redirection après login :

```typescript
// Après login, rediriger selon le rôle
switch (user.role) {
  case 'admin':
    return '/admin/dashboard'
  case 'merchant':
    return '/dashboard'
  case 'client':
    return '/boxes'
}
```

#### 6. Créer le premier admin

```typescript
// Script ou commande ace
// node ace make:admin admin@cuvee.app password123

import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

const admin = await User.create({
  email: 'admin@cuvee.app',
  password: await hash.make('password123'),
  role: 'admin',
  fullName: 'Admin Cuvée',
})
```

#### Critères d'acceptation
- [x] Migration pour le rôle admin
- [x] Middleware admin fonctionnel
- [x] Routes admin protégées
- [x] Layout admin avec navigation
- [x] Redirection après login selon le rôle
- [x] Commande ace `create:admin` pour créer le premier admin

---

### TICKET-ADMIN-2 : Gestion des utilisateurs

**Priorité :** P0
**Statut :** [x] Terminé
**Effort :** Moyen
**Dépend de :** TICKET-ADMIN-1

#### Description
CRUD complet pour gérer tous les utilisateurs de la plateforme.

#### API Controller

```typescript
// app/controllers/admin/users_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { createUserValidator, updateUserValidator } from '#validators/admin/user'

export default class UsersController {
  /**
   * Liste tous les utilisateurs avec filtres
   * GET /admin/users?role=merchant&search=dupont&page=1
   */
  async index({ request, response }: HttpContext) {
    const { role, search, page = 1, limit = 20 } = request.qs()

    const query = User.query().orderBy('createdAt', 'desc')

    if (role) {
      query.where('role', role)
    }

    if (search) {
      query.where((q) => {
        q.whereILike('email', `%${search}%`)
          .orWhereILike('fullName', `%${search}%`)
      })
    }

    const users = await query.paginate(page, limit)

    return response.ok({
      users: users.all().map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        createdAt: u.createdAt,
      })),
      meta: users.getMeta(),
    })
  }

  /**
   * Créer un utilisateur
   * POST /admin/users
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createUserValidator)

    const user = await User.create({
      email: data.email,
      password: await hash.make(data.password),
      role: data.role,
      fullName: data.fullName,
    })

    // Si merchant, créer le profil
    if (data.role === 'merchant' && data.shopName) {
      await user.related('merchantProfile').create({
        shopName: data.shopName,
      })
    }

    return response.created({ user })
  }

  /**
   * Détail d'un utilisateur
   * GET /admin/users/:id
   */
  async show({ params, response }: HttpContext) {
    const user = await User.query()
      .where('id', params.id)
      .preload('merchantProfile')
      .firstOrFail()

    // Charger les stats selon le rôle
    let stats = {}

    if (user.role === 'merchant') {
      const subscriptions = await user.related('merchantSubscriptions').query()
      stats = {
        clientsCount: subscriptions.length,
        // Ajouter d'autres stats
      }
    }

    if (user.role === 'client') {
      const subscriptions = await user.related('clientSubscriptions').query()
      stats = {
        merchantsCount: subscriptions.length,
        // Ajouter d'autres stats
      }
    }

    return response.ok({ user, stats })
  }

  /**
   * Modifier un utilisateur
   * PATCH /admin/users/:id
   */
  async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const data = await request.validateUsing(updateUserValidator)

    if (data.email) user.email = data.email
    if (data.fullName !== undefined) user.fullName = data.fullName
    if (data.role) user.role = data.role
    if (data.password) user.password = await hash.make(data.password)

    await user.save()

    return response.ok({ user })
  }

  /**
   * Supprimer un utilisateur
   * DELETE /admin/users/:id
   */
  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)

    // Empêcher la suppression de soi-même
    // Empêcher la suppression du dernier admin

    await user.delete()

    return response.ok({ message: 'Utilisateur supprimé' })
  }
}
```

#### Interface - Liste des utilisateurs

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Utilisateurs                                              [+ Créer]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌──────────────────┐  ┌────────────────────────────────────────────┐   │
│ │ 🔍 Rechercher... │  │ Tous ▼ │ Merchants │ Clients │ Admins │    │   │
│ └──────────────────┘  └────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Email              │ Nom          │ Rôle     │ Créé le   │ Actions │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ jean@cave.fr       │ Jean Dupont  │ merchant │ 01/01/24  │ [···]   │ │
│ │ marie@gmail.com    │ Marie L.     │ client   │ 15/01/24  │ [···]   │ │
│ │ pierre@email.fr    │ Pierre M.    │ client   │ 20/01/24  │ [···]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ← 1 2 3 ... 10 →                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Interface - Créer un utilisateur

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Créer un utilisateur                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Type de compte                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                     │
│ │  🏪          │ │  👤          │ │  🛡️          │                     │
│ │  Caviste     │ │  Client      │ │  Admin       │                     │
│ │  ○           │ │  ○           │ │  ○           │                     │
│ └──────────────┘ └──────────────┘ └──────────────┘                     │
│                                                                         │
│ Email *                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ jean@example.com                                                    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Nom complet                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Jean Dupont                                                         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Mot de passe *                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ••••••••                                              [Générer]     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ─── Si Caviste ───────────────────────────────────────────────────────  │
│                                                                         │
│ Nom de la cave *                                                        │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Cave du Château                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                                                   [ Annuler ] [ Créer ] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Interface - Détail utilisateur

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Jean Dupont                                    [Impersonate] [···]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Informations                    │ │ Statistiques                    │ │
│ │                                 │ │                                 │ │
│ │ Email: jean@cave.fr            │ │ Clients: 12                     │ │
│ │ Rôle: Caviste                  │ │ Box envoyées: 45                │ │
│ │ Créé le: 01/01/2024            │ │ Vins au catalogue: 28           │ │
│ │ Cave: Cave du Château          │ │                                 │ │
│ │                                 │ │                                 │ │
│ │ [Modifier]                      │ │                                 │ │
│ └─────────────────────────────────┘ └─────────────────────────────────┘ │
│                                                                         │
│ Abonnements (clients)                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Client           │ Statut  │ Depuis    │ Actions                    │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ Marie Lambert    │ Actif   │ 15/01/24  │ [Voir] [Délier]            │ │
│ │ Pierre Martin    │ Actif   │ 20/01/24  │ [Voir] [Délier]            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ [ + Lier un client ]                                                    │
│                                                                         │
│ ─────────────────────────────────────────────────────────────────────── │
│                                                                         │
│ Zone dangereuse                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Réinitialiser le mot de passe]    [Désactiver]    [Supprimer]     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Critères d'acceptation
- [x] Liste paginée avec recherche et filtres
- [x] Création d'utilisateur (merchant, client, admin)
- [x] Création automatique du merchant_profile si caviste
- [x] Vue détail avec stats
- [x] Modification des infos
- [x] Suppression (avec protections)
- [ ] Génération de mot de passe aléatoire (optionnel)

---

### TICKET-ADMIN-3 : Gestion des abonnements (liens client-caviste)

**Priorité :** P0
**Statut :** [x] Terminé
**Effort :** Faible
**Dépend de :** TICKET-ADMIN-2

#### Description
Permettre de créer et gérer les liens entre clients et cavistes.

#### API Controller

```typescript
// app/controllers/admin/subscriptions_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import User from '#models/user'

export default class SubscriptionsController {
  /**
   * Liste toutes les subscriptions
   * GET /admin/subscriptions?merchantId=xxx&clientId=xxx
   */
  async index({ request, response }: HttpContext) {
    const { merchantId, clientId, status, page = 1, limit = 20 } = request.qs()

    const query = Subscription.query()
      .preload('client')
      .preload('merchant', (q) => q.preload('merchantProfile'))
      .orderBy('createdAt', 'desc')

    if (merchantId) query.where('merchantId', merchantId)
    if (clientId) query.where('clientId', clientId)
    if (status) query.where('status', status)

    const subscriptions = await query.paginate(page, limit)

    return response.ok({
      subscriptions: subscriptions.all().map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        client: {
          id: s.client.id,
          email: s.client.email,
          fullName: s.client.fullName,
        },
        merchant: {
          id: s.merchant.id,
          email: s.merchant.email,
          shopName: s.merchant.merchantProfile?.shopName,
        },
      })),
      meta: subscriptions.getMeta(),
    })
  }

  /**
   * Créer une subscription (lier client à merchant)
   * POST /admin/subscriptions
   */
  async store({ request, response }: HttpContext) {
    const { clientId, merchantId, status = 'active' } = request.body()

    // Vérifier que le client existe et est un client
    const client = await User.findOrFail(clientId)
    if (client.role !== 'client') {
      return response.badRequest({ error: 'User is not a client' })
    }

    // Vérifier que le merchant existe et est un merchant
    const merchant = await User.findOrFail(merchantId)
    if (merchant.role !== 'merchant') {
      return response.badRequest({ error: 'User is not a merchant' })
    }

    // Vérifier qu'il n'existe pas déjà
    const existing = await Subscription.query()
      .where('clientId', clientId)
      .where('merchantId', merchantId)
      .first()

    if (existing) {
      return response.conflict({ error: 'Subscription already exists' })
    }

    const subscription = await Subscription.create({
      clientId,
      merchantId,
      status,
      activatedAt: status === 'active' ? new Date() : null,
    })

    return response.created({ subscription })
  }

  /**
   * Supprimer une subscription
   * DELETE /admin/subscriptions/:id
   */
  async destroy({ params, response }: HttpContext) {
    const subscription = await Subscription.findOrFail(params.id)
    await subscription.delete()

    return response.ok({ message: 'Subscription supprimée' })
  }
}
```

#### Interface - Liste des abonnements

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Abonnements                                               [+ Créer]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Client           │ Caviste          │ Statut  │ Depuis   │ Actions │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ Marie Lambert    │ Cave du Château  │ Actif   │ 15/01/24 │ [🗑️]    │ │
│ │ Pierre Martin    │ Cave du Château  │ Actif   │ 20/01/24 │ [🗑️]    │ │
│ │ Jean Dupont      │ Le Cellier       │ Pause   │ 01/12/23 │ [🗑️]    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Interface - Créer un lien

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Lier un client à un caviste                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Client                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Rechercher un client...                                    ▼     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│   → Marie Lambert (marie@gmail.com)                                     │
│   → Pierre Martin (pierre@email.fr)                                     │
│                                                                         │
│ Caviste                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Rechercher un caviste...                                   ▼     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│   → Cave du Château (jean@cave.fr)                                      │
│   → Le Cellier (paul@cellier.fr)                                        │
│                                                                         │
│ Statut                                                                  │
│ ○ Actif   ○ En pause   ○ Invitation en attente                         │
│                                                                         │
│                                                   [ Annuler ] [ Créer ] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Critères d'acceptation
- [x] Liste de toutes les subscriptions avec filtres
- [x] Création d'un lien client-caviste
- [x] Validation (rôles corrects, pas de doublon)
- [x] Suppression d'un lien
- [x] Select pour client et merchant

---

### TICKET-ADMIN-4 : Impersonation (Se connecter en tant que)

**Priorité :** P1
**Statut :** [x] Terminé
**Effort :** Moyen
**Dépend de :** TICKET-ADMIN-2

#### Description
Permettre à un admin de se connecter "en tant que" un autre utilisateur pour débugger ou faire une démo.

#### Sécurité
- Seuls les admins peuvent impersonate
- L'impersonation est loggée
- Un bandeau visible indique qu'on est en mode impersonation
- Bouton pour revenir à son compte admin

#### API

```typescript
// app/controllers/admin/users_controller.ts

/**
 * Impersonate un utilisateur
 * POST /admin/users/:id/impersonate
 */
async impersonate({ params, auth, response }: HttpContext) {
  const admin = auth.user!
  const targetUser = await User.findOrFail(params.id)

  // Empêcher d'impersonate un autre admin
  if (targetUser.role === 'admin') {
    return response.forbidden({ error: 'Cannot impersonate another admin' })
  }

  // Créer un token pour l'utilisateur cible
  const token = await User.accessTokens.create(targetUser)

  // Logger l'action
  console.log(`Admin ${admin.id} impersonating user ${targetUser.id}`)

  return response.ok({
    token: token.value!.release(),
    user: {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
    },
    impersonatedBy: admin.id,
  })
}
```

#### Frontend

```typescript
// Stocker l'info d'impersonation
const impersonate = async (userId: string) => {
  const res = await fetch(`/api/proxy/admin/users/${userId}/impersonate`, {
    method: 'POST',
  })
  const data = await res.json()

  // Sauvegarder le token admin actuel pour pouvoir revenir
  localStorage.setItem('admin_token', getCurrentToken())
  localStorage.setItem('impersonating', 'true')

  // Utiliser le nouveau token
  setAuthToken(data.token)

  // Rediriger selon le rôle
  if (data.user.role === 'merchant') {
    router.push('/dashboard')
  } else {
    router.push('/boxes')
  }
}

const stopImpersonating = () => {
  const adminToken = localStorage.getItem('admin_token')
  setAuthToken(adminToken)
  localStorage.removeItem('admin_token')
  localStorage.removeItem('impersonating')
  router.push('/admin/dashboard')
}
```

#### Bandeau d'impersonation

```tsx
// components/impersonation-banner.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    setIsImpersonating(localStorage.getItem('impersonating') === 'true')
  }, [])

  if (!isImpersonating) return null

  return (
    <div className="bg-yellow-500 text-yellow-950 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Mode impersonation - Vous êtes connecté en tant qu'un autre utilisateur
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="bg-yellow-600 border-yellow-600 text-white hover:bg-yellow-700"
        onClick={() => {
          // Revenir au compte admin
          const adminToken = localStorage.getItem('admin_token')
          // ... restaurer le token et rediriger
        }}
      >
        Revenir à mon compte
      </Button>
    </div>
  )
}
```

#### Critères d'acceptation
- [x] Bouton "Impersonate" sur la fiche utilisateur
- [x] Connexion en tant que l'utilisateur
- [ ] Bandeau visible indiquant l'impersonation (optionnel)
- [ ] Bouton pour revenir au compte admin (optionnel)
- [x] Impossible d'impersonate un autre admin
- [x] Action loggée

---

### TICKET-ADMIN-5 : Outils de démo

**Priorité :** P1
**Statut :** [x] Terminé
**Effort :** Moyen
**Dépend de :** TICKET-ADMIN-3

#### Description
Outils pour préparer rapidement une démo : création de données de test en un clic.

#### API Controller

```typescript
// app/controllers/admin/demo_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Wine from '#models/wine'
import Subscription from '#models/subscription'
import Box from '#models/box'
import BoxWine from '#models/box_wine'
import ClientWine from '#models/client_wine'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

const DEMO_WINES = [
  {
    name: 'Château Margaux',
    domain: 'Château Margaux',
    vintage: 2019,
    color: 'rouge',
    region: 'Bordeaux',
    grapes: 'Cabernet Sauvignon, Merlot',
    alcoholDegree: 13.5,
    guardMin: 10,
    guardMax: 30,
    aromas: ['Fruits noirs', 'Épices', 'Vanille'],
    foodPairings: ['Viande rouge', 'Gibier', 'Fromages affinés'],
  },
  {
    name: 'Meursault Premier Cru',
    domain: 'Domaine Roulot',
    vintage: 2020,
    color: 'blanc',
    region: 'Bourgogne',
    grapes: 'Chardonnay',
    alcoholDegree: 13,
    guardMin: 5,
    guardMax: 15,
    aromas: ['Beurre', 'Noisette', 'Fleurs blanches'],
    foodPairings: ['Poisson', 'Volaille', 'Fromages'],
  },
  // ... ajouter plus de vins
]

export default class DemoController {
  /**
   * Setup complet pour une démo
   * POST /admin/demo/setup
   */
  async setup({ request, response }: HttpContext) {
    const { merchantEmail, clientEmail, merchantName, clientName, shopName } = request.body()

    // 1. Créer le merchant
    let merchant = await User.findBy('email', merchantEmail)
    if (!merchant) {
      merchant = await User.create({
        email: merchantEmail,
        password: await hash.make('demo1234'),
        role: 'merchant',
        fullName: merchantName || 'Caviste Démo',
      })
      await merchant.related('merchantProfile').create({
        shopName: shopName || 'Cave Démo',
      })
    }

    // 2. Créer le client
    let client = await User.findBy('email', clientEmail)
    if (!client) {
      client = await User.create({
        email: clientEmail,
        password: await hash.make('demo1234'),
        role: 'client',
        fullName: clientName || 'Client Démo',
      })
    }

    // 3. Créer la subscription
    let subscription = await Subscription.query()
      .where('merchantId', merchant.id)
      .where('clientId', client.id)
      .first()

    if (!subscription) {
      subscription = await Subscription.create({
        merchantId: merchant.id,
        clientId: client.id,
        status: 'active',
        activatedAt: DateTime.now(),
      })
    }

    // 4. Créer les vins
    const wines = []
    for (const wineData of DEMO_WINES) {
      let wine = await Wine.query()
        .where('merchantId', merchant.id)
        .where('name', wineData.name)
        .first()

      if (!wine) {
        wine = await Wine.create({
          ...wineData,
          merchantId: merchant.id,
        })
      }
      wines.push(wine)
    }

    // 5. Créer une box avec 2 vins
    const currentMonth = DateTime.now().toFormat('yyyy-MM')
    let box = await Box.query()
      .where('subscriptionId', subscription.id)
      .where('month', currentMonth)
      .first()

    if (!box) {
      box = await Box.create({
        subscriptionId: subscription.id,
        month: currentMonth,
        status: 'sent',
        sentAt: DateTime.now(),
      })

      // Ajouter 2 vins à la box
      for (let i = 0; i < Math.min(2, wines.length); i++) {
        const boxWine = await BoxWine.create({
          boxId: box.id,
          wineId: wines[i].id,
          merchantNotes: `Notes de dégustation pour ${wines[i].name}`,
          position: i + 1,
        })

        // Créer le ClientWine
        await ClientWine.create({
          boxWineId: boxWine.id,
          clientId: client.id,
          status: 'in_cellar',
        })
      }
    }

    return response.ok({
      message: 'Démo setup complete',
      merchant: {
        email: merchant.email,
        password: 'demo1234',
      },
      client: {
        email: client.email,
        password: 'demo1234',
      },
      winesCount: wines.length,
      boxCreated: true,
    })
  }

  /**
   * Reset les données de démo
   * POST /admin/demo/reset
   */
  async reset({ request, response }: HttpContext) {
    const { merchantEmail, clientEmail } = request.body()

    // Supprimer le client
    if (clientEmail) {
      const client = await User.findBy('email', clientEmail)
      if (client) {
        await client.delete()
      }
    }

    // Supprimer le merchant (cascade sur wines, boxes, etc.)
    if (merchantEmail) {
      const merchant = await User.findBy('email', merchantEmail)
      if (merchant) {
        await merchant.delete()
      }
    }

    return response.ok({ message: 'Données de démo supprimées' })
  }
}
```

#### Interface - Page Démo

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🧪 Outils de démo                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Setup rapide                                                        │ │
│ │                                                                     │ │
│ │ Crée un compte caviste, un compte client, des vins exemples        │ │
│ │ et une box envoyée. Parfait pour une démo !                        │ │
│ │                                                                     │ │
│ │ Email caviste                                                       │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ demo-caviste@cuvee.app                                          │ │ │
│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                     │ │
│ │ Nom de la cave                                                      │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Cave du Château                                                 │ │ │
│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                     │ │
│ │ Email client                                                        │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ demo-client@cuvee.app                                           │ │ │
│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                     │ │
│ │ [ 🚀 Créer la démo ]                                                │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Résultat                                                            │ │
│ │                                                                     │ │
│ │ ✅ Caviste créé : demo-caviste@cuvee.app / demo1234                │ │
│ │ ✅ Client créé : demo-client@cuvee.app / demo1234                  │ │
│ │ ✅ 6 vins ajoutés au catalogue                                     │ │
│ │ ✅ 1 box envoyée avec 2 vins                                       │ │
│ │                                                                     │ │
│ │ [ 🔗 Ouvrir en tant que caviste ]  [ 🔗 Ouvrir en tant que client ]│ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ─────────────────────────────────────────────────────────────────────── │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Zone dangereuse                                                  │ │
│ │                                                                     │ │
│ │ [ 🗑️ Supprimer les données de démo ]                               │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Critères d'acceptation
- [x] Création d'un setup complet en 1 clic
- [x] Vins réalistes avec toutes les infos
- [x] Box déjà envoyée pour montrer le flow client
- [x] Affichage des identifiants créés
- [ ] Liens rapides pour ouvrir en tant que (optionnel)
- [x] Reset des données de démo

---

### TICKET-ADMIN-6 : Dashboard admin

**Priorité :** P2
**Statut :** [x] Terminé
**Effort :** Faible
**Dépend de :** TICKET-ADMIN-1

#### Description
Dashboard avec les KPIs de la plateforme.

#### API

```typescript
// app/controllers/admin/stats_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Wine from '#models/wine'
import Box from '#models/box'
import ClientWine from '#models/client_wine'
import db from '@adonisjs/lucid/services/db'

export default class StatsController {
  async index({ response }: HttpContext) {
    const [
      usersCount,
      merchantsCount,
      clientsCount,
      winesCount,
      boxesCount,
      ratingsCount,
    ] = await Promise.all([
      User.query().count('* as total'),
      User.query().where('role', 'merchant').count('* as total'),
      User.query().where('role', 'client').count('* as total'),
      Wine.query().count('* as total'),
      Box.query().where('status', 'sent').count('* as total'),
      ClientWine.query().whereNotNull('rating').count('* as total'),
    ])

    // Activité récente
    const recentUsers = await User.query()
      .orderBy('createdAt', 'desc')
      .limit(5)
      .select('id', 'email', 'role', 'createdAt')

    const recentBoxes = await Box.query()
      .where('status', 'sent')
      .orderBy('sentAt', 'desc')
      .limit(5)
      .preload('subscription', (q) => {
        q.preload('merchant', (mq) => mq.preload('merchantProfile'))
        q.preload('client')
      })

    return response.ok({
      stats: {
        users: Number(usersCount[0].$extras.total),
        merchants: Number(merchantsCount[0].$extras.total),
        clients: Number(clientsCount[0].$extras.total),
        wines: Number(winesCount[0].$extras.total),
        boxesSent: Number(boxesCount[0].$extras.total),
        ratings: Number(ratingsCount[0].$extras.total),
      },
      recentUsers,
      recentBoxes: recentBoxes.map((b) => ({
        id: b.id,
        month: b.month,
        sentAt: b.sentAt,
        merchant: b.subscription.merchant.merchantProfile?.shopName,
        client: b.subscription.client.fullName,
      })),
    })
  }
}
```

#### Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Dashboard Admin                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│ │    12      │ │     3      │ │     9      │ │    45      │            │
│ │ Utilisateurs│ │ Cavistes   │ │ Clients    │ │ Vins       │            │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘            │
│                                                                         │
│ ┌────────────┐ ┌────────────┐                                          │
│ │    28      │ │    156     │                                          │
│ │ Box envoyées│ │ Notes      │                                          │
│ └────────────┘ └────────────┘                                          │
│                                                                         │
│ ┌─────────────────────────────┐ ┌─────────────────────────────────────┐ │
│ │ Derniers inscrits           │ │ Dernières box envoyées              │ │
│ │                             │ │                                     │ │
│ │ • jean@cave.fr (merchant)   │ │ • Janvier 2024 - Cave du Château    │ │
│ │   il y a 2h                 │ │   → Marie Lambert                   │ │
│ │                             │ │                                     │ │
│ │ • marie@gmail.com (client)  │ │ • Janvier 2024 - Le Cellier         │ │
│ │   il y a 1 jour             │ │   → Pierre Martin                   │ │
│ │                             │ │                                     │ │
│ └─────────────────────────────┘ └─────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Critères d'acceptation
- [x] KPIs principaux affichés
- [x] Liste des derniers inscrits
- [x] Liste des dernières box envoyées
- [ ] Liens vers les détails (optionnel)

---

## Résumé Phase Admin

| Ticket | Description | Priorité | Effort | Statut |
|--------|-------------|----------|--------|--------|
| ADMIN-1 | Infrastructure | P0 | Moyen | [x] |
| ADMIN-2 | Gestion utilisateurs | P0 | Moyen | [x] |
| ADMIN-3 | Gestion abonnements | P0 | Faible | [x] |
| ADMIN-4 | Impersonation | P1 | Moyen | [x] |
| ADMIN-5 | Outils de démo | P1 | Moyen | [x] |
| ADMIN-6 | Dashboard admin | P2 | Faible | [x] |

**Definition of Done Phase Admin :**
- [x] Rôle admin fonctionnel
- [x] CRUD complet des utilisateurs
- [x] Création de liens client-caviste
- [x] Impersonation fonctionnelle
- [x] Setup de démo en 1 clic
- [x] Dashboard avec KPIs
