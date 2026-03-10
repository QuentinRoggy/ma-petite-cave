# Phase 2 : Espace Caviste

> Durée estimée : Semaine 2
> Objectif : Permettre au caviste de gérer ses clients et son catalogue de vins

---

## Vue d'ensemble

Cette phase construit l'espace de travail du caviste :
- Dashboard avec vue d'ensemble
- Gestion des clients (CRUD)
- Catalogue de vins enrichi (CRUD)

---

## Tickets

### TICKET-2.1 : API - CRUD Clients (Subscriptions)

**Priorité :** P0 (bloquant)
**Statut :** [x] Terminé
**Dépend de :** Phase 1 complète

#### Description
Créer les endpoints API pour gérer les clients du caviste.

#### Fichiers à créer
```
packages/api/app/
├── controllers/
│   └── merchant/
│       └── clients_controller.ts
└── validators/
    └── client.ts
```

#### Instructions détaillées

**1. Créer le validator `client.ts`**
```typescript
import vine from '@vinejs/vine'

export const createClientValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    fullName: vine.string().minLength(2),
    phone: vine.string().optional(),
    password: vine.string().minLength(8), // Mot de passe initial
    notes: vine.string().optional(), // Notes du caviste sur ce client
  })
)

export const updateClientValidator = vine.compile(
  vine.object({
    notes: vine.string().optional(),
    status: vine.enum(['active', 'paused', 'cancelled']).optional(),
  })
)
```

**2. Créer `clients_controller.ts`**
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Subscription from '#models/subscription'
import { createClientValidator, updateClientValidator } from '#validators/client'

export default class ClientsController {
  /**
   * Liste tous les clients du caviste
   * GET /merchant/clients
   */
  async index({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const { search, status } = request.qs()

    const query = Subscription.query()
      .where('merchantId', merchant.id)
      .preload('client')
      .preload('boxes', (boxQuery) => {
        boxQuery.orderBy('month', 'desc').limit(1)
      })
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (search) {
      query.whereHas('client', (clientQuery) => {
        clientQuery
          .whereILike('fullName', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
      })
    }

    const subscriptions = await query

    return response.ok({
      clients: subscriptions.map((sub) => ({
        id: sub.id,
        status: sub.status,
        notes: sub.notes,
        createdAt: sub.createdAt,
        client: {
          id: sub.client.id,
          email: sub.client.email,
          fullName: sub.client.fullName,
          phone: sub.client.phone,
        },
        lastBox: sub.boxes[0] || null,
      })),
    })
  }

  /**
   * Détail d'un client avec son historique
   * GET /merchant/clients/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    const subscription = await Subscription.query()
      .where('id', params.id)
      .where('merchantId', merchant.id)
      .preload('client')
      .preload('boxes', (boxQuery) => {
        boxQuery
          .orderBy('month', 'desc')
          .preload('boxWines', (bwQuery) => {
            bwQuery.preload('wine').preload('clientWines')
          })
      })
      .firstOrFail()

    return response.ok({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        notes: subscription.notes,
        createdAt: subscription.createdAt,
        client: {
          id: subscription.client.id,
          email: subscription.client.email,
          fullName: subscription.client.fullName,
          phone: subscription.client.phone,
        },
        boxes: subscription.boxes.map((box) => ({
          id: box.id,
          month: box.month,
          status: box.status,
          sentAt: box.sentAt,
          wines: box.boxWines.map((bw) => ({
            id: bw.id,
            wine: bw.wine,
            merchantNotes: bw.merchantNotes,
            clientFeedback: bw.clientWines[0] || null,
          })),
        })),
      },
    })
  }

  /**
   * Créer un nouveau client (onboarding magasin)
   * POST /merchant/clients
   */
  async store({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(createClientValidator)

    // Vérifier si l'email existe déjà
    const existingUser = await User.findBy('email', data.email)

    let client: User

    if (existingUser) {
      // L'utilisateur existe déjà
      if (existingUser.role !== 'client') {
        return response.badRequest({
          message: 'Cet email est associé à un compte caviste',
        })
      }

      // Vérifier s'il n'est pas déjà client de ce caviste
      const existingSub = await Subscription.query()
        .where('clientId', existingUser.id)
        .where('merchantId', merchant.id)
        .first()

      if (existingSub) {
        return response.badRequest({
          message: 'Ce client est déjà dans votre liste',
        })
      }

      client = existingUser
    } else {
      // Créer le nouveau client
      client = await User.create({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        role: 'client',
      })
    }

    // Créer la subscription
    const subscription = await Subscription.create({
      clientId: client.id,
      merchantId: merchant.id,
      status: 'active',
      notes: data.notes,
      activatedAt: DateTime.now(),
    })

    await subscription.load('client')

    return response.created({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        client: {
          id: client.id,
          email: client.email,
          fullName: client.fullName,
        },
      },
    })
  }

  /**
   * Modifier les infos d'un client (notes, status)
   * PATCH /merchant/clients/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(updateClientValidator)

    const subscription = await Subscription.query()
      .where('id', params.id)
      .where('merchantId', merchant.id)
      .firstOrFail()

    subscription.merge(data)
    await subscription.save()

    return response.ok({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        notes: subscription.notes,
      },
    })
  }

  /**
   * Statistiques des clients
   * GET /merchant/clients/stats
   */
  async stats({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const [total, active, withRecentBox] = await Promise.all([
      Subscription.query().where('merchantId', merchant.id).count('* as count'),
      Subscription.query().where('merchantId', merchant.id).where('status', 'active').count('* as count'),
      // Clients avec une box ce mois-ci
      Subscription.query()
        .where('merchantId', merchant.id)
        .whereHas('boxes', (q) => {
          q.where('month', DateTime.now().toFormat('yyyy-MM'))
        })
        .count('* as count'),
    ])

    return response.ok({
      stats: {
        total: Number(total[0].$extras.count),
        active: Number(active[0].$extras.count),
        withBoxThisMonth: Number(withRecentBox[0].$extras.count),
      },
    })
  }
}
```

**3. Ajouter les routes dans `start/routes.ts`**
```typescript
import router from '@adonisjs/core/services/router'

const ClientsController = () => import('#controllers/merchant/clients_controller')

router.group(() => {
  router.get('/clients/stats', [ClientsController, 'stats'])
  router.get('/clients', [ClientsController, 'index'])
  router.post('/clients', [ClientsController, 'store'])
  router.get('/clients/:id', [ClientsController, 'show'])
  router.patch('/clients/:id', [ClientsController, 'update'])
})
  .prefix('/merchant')
  .middleware([middleware.auth(), middleware.role({ roles: ['merchant'] })])
```

#### Critères d'acceptation
- [x] `GET /merchant/clients` retourne la liste des clients
- [x] `GET /merchant/clients/:id` retourne le détail avec historique
- [x] `POST /merchant/clients` crée un nouveau client
- [x] `PATCH /merchant/clients/:id` modifie les notes/status
- [x] Les routes sont protégées (merchant only)

---

### TICKET-2.2 : API - CRUD Catalogue Vins

**Priorité :** P0 (bloquant)
**Statut :** [x] Terminé
**Dépend de :** Phase 1 complète

#### Description
Créer les endpoints API pour gérer le catalogue de vins du caviste.

#### Fichiers à créer/modifier
```
packages/api/app/
├── controllers/
│   └── merchant/
│       └── wines_controller.ts
└── validators/
    └── wine.ts
```

#### Instructions détaillées

**1. Modifier le validator `wine.ts`**
```typescript
import vine from '@vinejs/vine'

export const createWineValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(255),
    domain: vine.string().maxLength(255).optional(),
    vintage: vine.number().min(1900).max(2100).optional(),
    color: vine.enum(['rouge', 'blanc', 'rosé', 'pétillant']).optional(),
    region: vine.string().maxLength(255).optional(),
    grapes: vine.string().maxLength(255).optional(),
    alcoholDegree: vine.number().min(0).max(20).optional(),
    aromas: vine.array(vine.string()).optional(),
    foodPairings: vine.array(vine.string()).optional(),
    guardMin: vine.number().min(0).max(50).optional(),
    guardMax: vine.number().min(0).max(50).optional(),
    photoUrl: vine.string().url().optional(),
    notes: vine.string().optional(),
  })
)

export const updateWineValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(255).optional(),
    domain: vine.string().maxLength(255).optional().nullable(),
    vintage: vine.number().min(1900).max(2100).optional().nullable(),
    color: vine.enum(['rouge', 'blanc', 'rosé', 'pétillant']).optional().nullable(),
    region: vine.string().maxLength(255).optional().nullable(),
    grapes: vine.string().maxLength(255).optional().nullable(),
    alcoholDegree: vine.number().min(0).max(20).optional().nullable(),
    aromas: vine.array(vine.string()).optional().nullable(),
    foodPairings: vine.array(vine.string()).optional().nullable(),
    guardMin: vine.number().min(0).max(50).optional().nullable(),
    guardMax: vine.number().min(0).max(50).optional().nullable(),
    photoUrl: vine.string().url().optional().nullable(),
    notes: vine.string().optional().nullable(),
  })
)
```

**2. Créer `wines_controller.ts` (merchant)**
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Wine from '#models/wine'
import { createWineValidator, updateWineValidator } from '#validators/wine'

export default class WinesController {
  /**
   * Liste le catalogue de vins du caviste
   * GET /merchant/wines
   */
  async index({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const { search, color, page = 1, limit = 20 } = request.qs()

    const query = Wine.query()
      .where('merchantId', merchant.id)
      .orderBy('createdAt', 'desc')

    if (search) {
      query.where((q) => {
        q.whereILike('name', `%${search}%`)
          .orWhereILike('domain', `%${search}%`)
          .orWhereILike('region', `%${search}%`)
      })
    }

    if (color) {
      query.where('color', color)
    }

    const wines = await query.paginate(page, limit)

    return response.ok({
      wines: wines.all(),
      meta: wines.getMeta(),
    })
  }

  /**
   * Détail d'un vin
   * GET /merchant/wines/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    const wine = await Wine.query()
      .where('id', params.id)
      .where('merchantId', merchant.id)
      .firstOrFail()

    return response.ok({ wine })
  }

  /**
   * Créer un vin dans le catalogue
   * POST /merchant/wines
   */
  async store({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(createWineValidator)

    const wine = await Wine.create({
      ...data,
      merchantId: merchant.id,
    })

    return response.created({ wine })
  }

  /**
   * Modifier un vin
   * PATCH /merchant/wines/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(updateWineValidator)

    const wine = await Wine.query()
      .where('id', params.id)
      .where('merchantId', merchant.id)
      .firstOrFail()

    wine.merge(data)
    await wine.save()

    return response.ok({ wine })
  }

  /**
   * Supprimer un vin
   * DELETE /merchant/wines/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    const wine = await Wine.query()
      .where('id', params.id)
      .where('merchantId', merchant.id)
      .firstOrFail()

    await wine.delete()

    return response.noContent()
  }

  /**
   * Stats du catalogue
   * GET /merchant/wines/stats
   */
  async stats({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const [total, byColor] = await Promise.all([
      Wine.query().where('merchantId', merchant.id).count('* as count'),
      Wine.query()
        .where('merchantId', merchant.id)
        .select('color')
        .count('* as count')
        .groupBy('color'),
    ])

    return response.ok({
      stats: {
        total: Number(total[0].$extras.count),
        byColor: byColor.reduce((acc, row) => {
          acc[row.color || 'non_défini'] = Number(row.$extras.count)
          return acc
        }, {} as Record<string, number>),
      },
    })
  }
}
```

**3. Ajouter les routes**
```typescript
const MerchantWinesController = () => import('#controllers/merchant/wines_controller')

router.group(() => {
  // ... routes clients
  router.get('/wines/stats', [MerchantWinesController, 'stats'])
  router.get('/wines', [MerchantWinesController, 'index'])
  router.post('/wines', [MerchantWinesController, 'store'])
  router.get('/wines/:id', [MerchantWinesController, 'show'])
  router.patch('/wines/:id', [MerchantWinesController, 'update'])
  router.delete('/wines/:id', [MerchantWinesController, 'destroy'])
})
  .prefix('/merchant')
  .middleware([middleware.auth(), middleware.role({ roles: ['merchant'] })])
```

#### Critères d'acceptation
- [x] `GET /merchant/wines` retourne le catalogue avec pagination
- [x] `POST /merchant/wines` crée un vin
- [x] `PATCH /merchant/wines/:id` modifie un vin
- [x] `DELETE /merchant/wines/:id` supprime un vin
- [x] La recherche fonctionne (nom, domaine, région)
- [x] Le filtre par couleur fonctionne

---

### TICKET-2.3 : Frontend - Dashboard Caviste

**Priorité :** P1
**Statut :** [x] Terminé
**Dépend de :** TICKET-2.1, TICKET-2.2

#### Description
Créer la page dashboard avec vue d'ensemble pour le caviste.

#### Fichiers à créer
```
packages/app/app/(merchant)/dashboard/
└── page.tsx
```

#### Instructions détaillées

**1. Créer la page dashboard**
```tsx
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Wine, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getStats(token: string) {
  const [clientsRes, winesRes] = await Promise.all([
    fetch(`${process.env.API_URL}/merchant/clients/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${process.env.API_URL}/merchant/wines/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ])

  return {
    clients: await clientsRes.json(),
    wines: await winesRes.json(),
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  const { clients, wines } = await getStats(session!.token)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/clients/new">
            <Button>+ Nouveau client</Button>
          </Link>
          <Link href="/wines/new">
            <Button variant="outline">+ Nouveau vin</Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Clients actifs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.stats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {clients.stats.total} au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Box ce mois
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.stats.withBoxThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">
              clients servis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Catalogue vins
            </CardTitle>
            <Wine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wines.stats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              références
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Répartition
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {Object.entries(wines.stats.byColor).map(([color, count]) => (
                <div key={color} className="flex justify-between">
                  <span className="capitalize">{color}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/boxes/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Créer une nouvelle box
              </Button>
            </Link>
            <Link href="/clients" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Voir tous les clients
              </Button>
            </Link>
            <Link href="/wines" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Wine className="mr-2 h-4 w-4" />
                Gérer le catalogue
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* TODO: Derniers feedbacks des clients */}
        <Card>
          <CardHeader>
            <CardTitle>Derniers feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Les notes de vos clients apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

#### Critères d'acceptation
- [x] Les stats s'affichent correctement
- [x] Les actions rapides fonctionnent
- [x] Le layout est responsive

---

### TICKET-2.4 : Frontend - Liste des clients

**Priorité :** P1
**Statut :** [x] Terminé
**Dépend de :** TICKET-2.1

#### Description
Créer la page de liste des clients avec recherche.

#### Fichiers à créer
```
packages/app/app/(merchant)/clients/
├── page.tsx
└── components/
    └── client-card.tsx
```

#### Instructions détaillées

**1. Créer `client-card.tsx`**
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

interface ClientCardProps {
  subscription: {
    id: string
    status: string
    client: {
      fullName: string
      email: string
    }
    lastBox?: {
      month: string
      status: string
    }
  }
}

export function ClientCard({ subscription }: ClientCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <Link href={`/clients/${subscription.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">
                {subscription.client.fullName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {subscription.client.email}
              </p>
            </div>
            <Badge className={statusColors[subscription.status as keyof typeof statusColors]}>
              {subscription.status}
            </Badge>
          </div>

          {subscription.lastBox && (
            <div className="mt-3 text-sm text-muted-foreground">
              Dernière box : {subscription.lastBox.month}
              {subscription.lastBox.status === 'draft' && (
                <Badge variant="outline" className="ml-2">Brouillon</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
```

**2. Créer `page.tsx`**
```tsx
import { getSession } from '@/lib/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { ClientCard } from './components/client-card'

async function getClients(token: string, search?: string) {
  const url = new URL(`${process.env.API_URL}/merchant/clients`)
  if (search) url.searchParams.set('search', search)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const session = await getSession()
  const { clients } = await getClients(session!.token, searchParams.search)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Rechercher un client..."
            defaultValue={searchParams.search}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {/* List */}
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchParams.search
              ? 'Aucun client trouvé'
              : 'Vous n\'avez pas encore de client'}
          </p>
          {!searchParams.search && (
            <Link href="/clients/new">
              <Button className="mt-4">Ajouter votre premier client</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((subscription: any) => (
            <ClientCard key={subscription.id} subscription={subscription} />
          ))}
        </div>
      )}
    </div>
  )
}
```

#### Critères d'acceptation
- [x] La liste des clients s'affiche
- [x] La recherche fonctionne
- [x] Le clic sur un client mène au détail
- [x] L'état vide est géré

---

### TICKET-2.5 : Frontend - Formulaire création client

**Priorité :** P1
**Statut :** [x] Terminé
**Dépend de :** TICKET-2.1

#### Description
Créer le formulaire pour ajouter un nouveau client (onboarding magasin).

#### Fichiers à créer
```
packages/app/app/(merchant)/clients/new/
└── page.tsx
```

#### Instructions détaillées

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      email: formData.get('email'),
      fullName: formData.get('fullName'),
      phone: formData.get('phone') || undefined,
      password: formData.get('password'),
      notes: formData.get('notes') || undefined,
    }

    try {
      const res = await fetch('/api/merchant/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Erreur lors de la création')
      }

      toast.success('Client créé avec succès')
      router.push('/clients')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Nouveau client</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe initial *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 caractères"
                  minLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Le client pourra le modifier plus tard
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (visible uniquement par vous)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Préférences, allergies, infos utiles..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/clients">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer le client
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### Critères d'acceptation
- [x] Le formulaire valide les champs requis
- [x] La création fonctionne
- [x] Les erreurs sont affichées (email déjà utilisé, etc.)
- [x] Redirection vers la liste après création

---

### TICKET-2.6 : Frontend - Catalogue vins

**Priorité :** P1
**Statut :** [x] Terminé
**Dépend de :** TICKET-2.2

#### Description
Créer la page catalogue avec liste, recherche, et CRUD des vins.

#### Fichiers à créer
```
packages/app/app/(merchant)/wines/
├── page.tsx
├── new/
│   └── page.tsx
├── [id]/
│   └── page.tsx
└── components/
    ├── wine-catalog-card.tsx
    └── wine-form.tsx
```

#### Instructions détaillées

**1. Créer `wine-catalog-card.tsx`**
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'

interface WineCatalogCardProps {
  wine: {
    id: string
    name: string
    domain?: string
    vintage?: number
    color?: string
    region?: string
    photoUrl?: string
  }
}

const colorLabels = {
  rouge: 'Rouge',
  blanc: 'Blanc',
  rosé: 'Rosé',
  pétillant: 'Pétillant',
}

const colorClasses = {
  rouge: 'bg-red-100 text-red-800',
  blanc: 'bg-yellow-100 text-yellow-800',
  rosé: 'bg-pink-100 text-pink-800',
  pétillant: 'bg-blue-100 text-blue-800',
}

export function WineCatalogCard({ wine }: WineCatalogCardProps) {
  return (
    <Link href={`/wines/${wine.id}`}>
      <Card className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="aspect-[3/4] relative bg-muted">
          {wine.photoUrl ? (
            <Image
              src={wine.photoUrl}
              alt={wine.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Pas de photo
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium truncate">{wine.name}</h3>
          {wine.domain && (
            <p className="text-sm text-muted-foreground truncate">
              {wine.domain}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {wine.vintage && (
              <span className="text-sm font-medium">{wine.vintage}</span>
            )}
            {wine.color && (
              <Badge className={colorClasses[wine.color as keyof typeof colorClasses]}>
                {colorLabels[wine.color as keyof typeof colorLabels]}
              </Badge>
            )}
          </div>
          {wine.region && (
            <p className="text-xs text-muted-foreground mt-1">{wine.region}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
```

**2. Créer `wine-form.tsx`**
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PhotoUploader } from '@/components/photo-uploader'
import { Badge } from '@/components/ui/badge'

interface WineFormProps {
  wine?: any // Données existantes pour l'édition
  mode: 'create' | 'edit'
}

export function WineForm({ wine, mode }: WineFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(wine?.photoUrl || '')
  const [aromas, setAromas] = useState<string[]>(wine?.aromas || [])
  const [foodPairings, setFoodPairings] = useState<string[]>(wine?.foodPairings || [])
  const [newAroma, setNewAroma] = useState('')
  const [newPairing, setNewPairing] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      domain: formData.get('domain') || null,
      vintage: formData.get('vintage') ? Number(formData.get('vintage')) : null,
      color: formData.get('color') || null,
      region: formData.get('region') || null,
      grapes: formData.get('grapes') || null,
      alcoholDegree: formData.get('alcoholDegree') ? Number(formData.get('alcoholDegree')) : null,
      guardMin: formData.get('guardMin') ? Number(formData.get('guardMin')) : null,
      guardMax: formData.get('guardMax') ? Number(formData.get('guardMax')) : null,
      aromas: aromas.length > 0 ? aromas : null,
      foodPairings: foodPairings.length > 0 ? foodPairings : null,
      photoUrl: photoUrl || null,
      notes: formData.get('notes') || null,
    }

    try {
      const url = mode === 'create'
        ? '/api/merchant/wines'
        : `/api/merchant/wines/${wine.id}`

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Erreur lors de la sauvegarde')
      }

      toast.success(mode === 'create' ? 'Vin ajouté au catalogue' : 'Vin mis à jour')
      router.push('/wines')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addAroma = () => {
    if (newAroma.trim() && !aromas.includes(newAroma.trim())) {
      setAromas([...aromas, newAroma.trim()])
      setNewAroma('')
    }
  }

  const addPairing = () => {
    if (newPairing.trim() && !foodPairings.includes(newPairing.trim())) {
      setFoodPairings([...foodPairings, newPairing.trim()])
      setNewPairing('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploader
            value={photoUrl}
            onChange={setPhotoUrl}
          />
        </CardContent>
      </Card>

      {/* Infos de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du vin *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={wine?.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domaine</Label>
              <Input
                id="domain"
                name="domain"
                defaultValue={wine?.domain}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vintage">Millésime</Label>
              <Input
                id="vintage"
                name="vintage"
                type="number"
                min={1900}
                max={2100}
                defaultValue={wine?.vintage}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Couleur</Label>
              <Select name="color" defaultValue={wine?.color}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rouge">Rouge</SelectItem>
                  <SelectItem value="blanc">Blanc</SelectItem>
                  <SelectItem value="rosé">Rosé</SelectItem>
                  <SelectItem value="pétillant">Pétillant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Région</Label>
              <Input
                id="region"
                name="region"
                defaultValue={wine?.region}
                placeholder="Bordeaux, Bourgogne..."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grapes">Cépages</Label>
              <Input
                id="grapes"
                name="grapes"
                defaultValue={wine?.grapes}
                placeholder="Merlot, Cabernet..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alcoholDegree">Degré d'alcool (%)</Label>
              <Input
                id="alcoholDegree"
                name="alcoholDegree"
                type="number"
                step="0.1"
                min={0}
                max={20}
                defaultValue={wine?.alcoholDegree}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Garde */}
      <Card>
        <CardHeader>
          <CardTitle>Garde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guardMin">Garde minimum (années)</Label>
              <Input
                id="guardMin"
                name="guardMin"
                type="number"
                min={0}
                max={50}
                defaultValue={wine?.guardMin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardMax">Garde maximum (années)</Label>
              <Input
                id="guardMax"
                name="guardMax"
                type="number"
                min={0}
                max={50}
                defaultValue={wine?.guardMax}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arômes */}
      <Card>
        <CardHeader>
          <CardTitle>Arômes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newAroma}
              onChange={(e) => setNewAroma(e.target.value)}
              placeholder="Ajouter un arôme"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAroma())}
            />
            <Button type="button" onClick={addAroma} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {aromas.map((aroma) => (
              <Badge key={aroma} variant="secondary">
                {aroma}
                <button
                  type="button"
                  onClick={() => setAromas(aromas.filter((a) => a !== aroma))}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accords mets */}
      <Card>
        <CardHeader>
          <CardTitle>Accords mets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newPairing}
              onChange={(e) => setNewPairing(e.target.value)}
              placeholder="Ajouter un accord"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPairing())}
            />
            <Button type="button" onClick={addPairing} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {foodPairings.map((pairing) => (
              <Badge key={pairing} variant="secondary">
                {pairing}
                <button
                  type="button"
                  onClick={() => setFoodPairings(foodPairings.filter((p) => p !== pairing))}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes générales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="notes"
            defaultValue={wine?.notes}
            placeholder="Notes sur ce vin..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Ajouter au catalogue' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
```

#### Critères d'acceptation
- [x] La liste affiche les vins avec photos
- [x] La recherche fonctionne
- [x] Le filtre par couleur fonctionne
- [x] Création d'un vin avec tous les champs enrichis
- [x] Édition d'un vin existant
- [x] Suppression avec confirmation

---

## Résumé Phase 2

| Ticket | Description | Priorité | Statut |
|--------|-------------|----------|--------|
| 2.1 | API CRUD Clients | P0 | [x] |
| 2.2 | API CRUD Catalogue Vins | P0 | [x] |
| 2.3 | Frontend Dashboard | P1 | [x] |
| 2.4 | Frontend Liste clients | P1 | [x] |
| 2.5 | Frontend Formulaire client | P1 | [x] |
| 2.6 | Frontend Catalogue vins | P1 | [x] |

**Definition of Done Phase 2 :**
- [x] Le caviste peut voir son dashboard avec stats
- [x] Le caviste peut lister/créer/modifier ses clients
- [x] Le caviste peut gérer son catalogue de vins (CRUD complet)
- [x] Les recherches fonctionnent
- [x] L'interface est fonctionnelle sur desktop
