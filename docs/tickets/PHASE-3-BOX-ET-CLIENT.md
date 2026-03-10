# Phase 3 : Box & Espace Client

> Durée estimée : Semaine 3
> Objectif : Permettre au caviste de créer des box et au client de les consulter/noter

---

## Vue d'ensemble

Cette phase est le coeur du produit :
- Le caviste peut créer et envoyer des box à ses clients
- Le client peut voir ses box et les détails des vins
- Le client peut noter les vins après dégustation

---

## Tickets

### TICKET-3.1 : API - CRUD Box

**Priorité :** P0 (bloquant)
**Statut :** [x] Terminé
**Dépend de :** Phase 2 complète

#### Description
Créer les endpoints API pour gérer les box mensuelles.

#### Fichiers à créer
```
packages/api/app/
├── controllers/
│   └── merchant/
│       └── boxes_controller.ts
└── validators/
    └── box.ts
```

#### Instructions détaillées

**1. Créer le validator `box.ts`**
```typescript
import vine from '@vinejs/vine'

export const createBoxValidator = vine.compile(
  vine.object({
    subscriptionId: vine.string().uuid(),
    month: vine.string().regex(/^\d{4}-\d{2}$/), // Format: 2025-01
    wines: vine.array(
      vine.object({
        wineId: vine.string().uuid(),
        merchantNotes: vine.string().optional(),
        position: vine.number().min(1).max(10).optional(),
      })
    ).minLength(1).maxLength(10),
  })
)

export const updateBoxValidator = vine.compile(
  vine.object({
    wines: vine.array(
      vine.object({
        id: vine.string().uuid().optional(), // Si édition d'un BoxWine existant
        wineId: vine.string().uuid(),
        merchantNotes: vine.string().optional(),
        position: vine.number().min(1).max(10).optional(),
      })
    ).minLength(1).maxLength(10).optional(),
  })
)

export const addWineToBoxValidator = vine.compile(
  vine.object({
    wineId: vine.string().uuid(),
    merchantNotes: vine.string().optional(),
    position: vine.number().min(1).max(10).optional(),
  })
)
```

**2. Créer `boxes_controller.ts`**
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Box from '#models/box'
import BoxWine from '#models/box_wine'
import ClientWine from '#models/client_wine'
import Subscription from '#models/subscription'
import { createBoxValidator, updateBoxValidator, addWineToBoxValidator } from '#validators/box'

export default class BoxesController {
  /**
   * Liste toutes les box du caviste
   * GET /merchant/boxes
   */
  async index({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const { clientId, month, status, page = 1, limit = 20 } = request.qs()

    const query = Box.query()
      .whereHas('subscription', (subQuery) => {
        subQuery.where('merchantId', merchant.id)
        if (clientId) {
          subQuery.where('clientId', clientId)
        }
      })
      .preload('subscription', (subQuery) => {
        subQuery.preload('client')
      })
      .preload('boxWines', (bwQuery) => {
        bwQuery.preload('wine')
      })
      .orderBy('month', 'desc')

    if (month) {
      query.where('month', month)
    }

    if (status) {
      query.where('status', status)
    }

    const boxes = await query.paginate(page, limit)

    return response.ok({
      boxes: boxes.all().map((box) => ({
        id: box.id,
        month: box.month,
        status: box.status,
        sentAt: box.sentAt,
        client: {
          id: box.subscription.client.id,
          fullName: box.subscription.client.fullName,
          email: box.subscription.client.email,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: bw.wine,
          merchantNotes: bw.merchantNotes,
          position: bw.position,
        })),
      })),
      meta: boxes.getMeta(),
    })
  }

  /**
   * Détail d'une box
   * GET /merchant/boxes/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    const box = await Box.query()
      .where('id', params.id)
      .whereHas('subscription', (subQuery) => {
        subQuery.where('merchantId', merchant.id)
      })
      .preload('subscription', (subQuery) => {
        subQuery.preload('client')
      })
      .preload('boxWines', (bwQuery) => {
        bwQuery.preload('wine').preload('clientWines')
      })
      .firstOrFail()

    return response.ok({
      box: {
        id: box.id,
        month: box.month,
        status: box.status,
        sentAt: box.sentAt,
        createdAt: box.createdAt,
        client: {
          id: box.subscription.client.id,
          fullName: box.subscription.client.fullName,
          email: box.subscription.client.email,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: bw.wine,
          merchantNotes: bw.merchantNotes,
          position: bw.position,
          clientFeedback: bw.clientWines[0] || null,
        })),
      },
    })
  }

  /**
   * Créer une nouvelle box
   * POST /merchant/boxes
   */
  async store({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(createBoxValidator)

    // Vérifier que la subscription appartient au merchant
    const subscription = await Subscription.query()
      .where('id', data.subscriptionId)
      .where('merchantId', merchant.id)
      .firstOrFail()

    // Vérifier qu'il n'y a pas déjà une box pour ce mois
    const existingBox = await Box.query()
      .where('subscriptionId', subscription.id)
      .where('month', data.month)
      .first()

    if (existingBox) {
      return response.badRequest({
        message: `Une box existe déjà pour ${data.month}`,
      })
    }

    // Créer la box
    const box = await Box.create({
      subscriptionId: subscription.id,
      month: data.month,
      status: 'draft',
    })

    // Ajouter les vins
    for (const wineData of data.wines) {
      await BoxWine.create({
        boxId: box.id,
        wineId: wineData.wineId,
        merchantNotes: wineData.merchantNotes,
        position: wineData.position || data.wines.indexOf(wineData) + 1,
      })
    }

    await box.load('boxWines', (q) => q.preload('wine'))
    await box.load('subscription', (q) => q.preload('client'))

    return response.created({
      box: {
        id: box.id,
        month: box.month,
        status: box.status,
        client: {
          id: box.subscription.client.id,
          fullName: box.subscription.client.fullName,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: bw.wine,
          merchantNotes: bw.merchantNotes,
        })),
      },
    })
  }

  /**
   * Modifier une box (seulement si draft)
   * PATCH /merchant/boxes/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(updateBoxValidator)

    const box = await Box.query()
      .where('id', params.id)
      .whereHas('subscription', (subQuery) => {
        subQuery.where('merchantId', merchant.id)
      })
      .firstOrFail()

    if (box.status !== 'draft') {
      return response.badRequest({
        message: 'Impossible de modifier une box déjà envoyée',
      })
    }

    // Mettre à jour les vins si fournis
    if (data.wines) {
      // Supprimer les anciens
      await BoxWine.query().where('boxId', box.id).delete()

      // Ajouter les nouveaux
      for (const wineData of data.wines) {
        await BoxWine.create({
          boxId: box.id,
          wineId: wineData.wineId,
          merchantNotes: wineData.merchantNotes,
          position: wineData.position || data.wines.indexOf(wineData) + 1,
        })
      }
    }

    await box.load('boxWines', (q) => q.preload('wine'))

    return response.ok({
      box: {
        id: box.id,
        month: box.month,
        status: box.status,
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: bw.wine,
          merchantNotes: bw.merchantNotes,
        })),
      },
    })
  }

  /**
   * Envoyer une box au client
   * POST /merchant/boxes/:id/send
   */
  async send({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    const box = await Box.query()
      .where('id', params.id)
      .whereHas('subscription', (subQuery) => {
        subQuery.where('merchantId', merchant.id)
      })
      .preload('subscription')
      .preload('boxWines')
      .firstOrFail()

    if (box.status === 'sent') {
      return response.badRequest({
        message: 'Cette box a déjà été envoyée',
      })
    }

    if (box.boxWines.length === 0) {
      return response.badRequest({
        message: 'Impossible d\'envoyer une box vide',
      })
    }

    // Marquer comme envoyée
    box.status = 'sent'
    box.sentAt = DateTime.now()
    await box.save()

    // Créer les ClientWine pour que le client puisse les noter
    for (const boxWine of box.boxWines) {
      await ClientWine.create({
        boxWineId: boxWine.id,
        clientId: box.subscription.clientId,
        status: 'in_cellar',
      })
    }

    // TODO: Envoyer une notification au client

    return response.ok({
      message: 'Box envoyée avec succès',
      box: {
        id: box.id,
        status: box.status,
        sentAt: box.sentAt,
      },
    })
  }

  /**
   * Supprimer une box (seulement si draft)
   * DELETE /merchant/boxes/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    const box = await Box.query()
      .where('id', params.id)
      .whereHas('subscription', (subQuery) => {
        subQuery.where('merchantId', merchant.id)
      })
      .firstOrFail()

    if (box.status !== 'draft') {
      return response.badRequest({
        message: 'Impossible de supprimer une box déjà envoyée',
      })
    }

    await box.delete()

    return response.noContent()
  }
}
```

**3. Ajouter les routes**
```typescript
const BoxesController = () => import('#controllers/merchant/boxes_controller')

router.group(() => {
  // ... autres routes
  router.get('/boxes', [BoxesController, 'index'])
  router.post('/boxes', [BoxesController, 'store'])
  router.get('/boxes/:id', [BoxesController, 'show'])
  router.patch('/boxes/:id', [BoxesController, 'update'])
  router.post('/boxes/:id/send', [BoxesController, 'send'])
  router.delete('/boxes/:id', [BoxesController, 'destroy'])
})
  .prefix('/merchant')
  .middleware([middleware.auth(), middleware.role({ roles: ['merchant'] })])
```

#### Critères d'acceptation
- [ ] Créer une box avec plusieurs vins
- [ ] Modifier une box (draft uniquement)
- [ ] Envoyer une box → crée les ClientWine
- [ ] Supprimer une box (draft uniquement)
- [ ] Lister les box avec filtres

---

### TICKET-3.2 : API - Espace Client (Boxes & Wines)

**Priorité :** P0 (bloquant)
**Statut :** [x] Terminé
**Dépend de :** TICKET-3.1

#### Description
Créer les endpoints API pour l'espace client.

#### Fichiers à créer
```
packages/api/app/
├── controllers/
│   └── client/
│       ├── boxes_controller.ts
│       └── wines_controller.ts
└── validators/
    └── client_wine.ts
```

#### Instructions détaillées

**1. Créer `client/boxes_controller.ts`**
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Box from '#models/box'
import Subscription from '#models/subscription'

export default class ClientBoxesController {
  /**
   * Liste les box du client
   * GET /client/boxes
   */
  async index({ auth, request, response }: HttpContext) {
    const client = auth.user!
    const { page = 1, limit = 20 } = request.qs()

    const subscriptionIds = await Subscription.query()
      .where('clientId', client.id)
      .where('status', 'active')
      .select('id')

    const boxes = await Box.query()
      .whereIn('subscriptionId', subscriptionIds.map((s) => s.id))
      .where('status', 'sent') // Seulement les box envoyées
      .preload('subscription', (q) => {
        q.preload('merchant', (mq) => mq.preload('merchantProfile'))
      })
      .preload('boxWines', (bwQuery) => {
        bwQuery.preload('wine').preload('clientWines', (cwQuery) => {
          cwQuery.where('clientId', client.id)
        })
      })
      .orderBy('sentAt', 'desc')
      .paginate(page, limit)

    return response.ok({
      boxes: boxes.all().map((box) => ({
        id: box.id,
        month: box.month,
        sentAt: box.sentAt,
        merchant: {
          shopName: box.subscription.merchant.merchantProfile?.shopName,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: {
            id: bw.wine.id,
            name: bw.wine.name,
            domain: bw.wine.domain,
            vintage: bw.wine.vintage,
            color: bw.wine.color,
            photoUrl: bw.wine.photoUrl,
          },
          clientWine: bw.clientWines[0] || null,
        })),
        // Stats rapides
        totalWines: box.boxWines.length,
        ratedWines: box.boxWines.filter((bw) => bw.clientWines[0]?.rating).length,
      })),
      meta: boxes.getMeta(),
    })
  }

  /**
   * Détail d'une box
   * GET /client/boxes/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const client = auth.user!

    const box = await Box.query()
      .where('id', params.id)
      .where('status', 'sent')
      .whereHas('subscription', (subQuery) => {
        subQuery.where('clientId', client.id)
      })
      .preload('subscription', (q) => {
        q.preload('merchant', (mq) => mq.preload('merchantProfile'))
      })
      .preload('boxWines', (bwQuery) => {
        bwQuery.preload('wine').preload('clientWines', (cwQuery) => {
          cwQuery.where('clientId', client.id)
        })
      })
      .firstOrFail()

    return response.ok({
      box: {
        id: box.id,
        month: box.month,
        sentAt: box.sentAt,
        merchant: {
          shopName: box.subscription.merchant.merchantProfile?.shopName,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          merchantNotes: bw.merchantNotes,
          wine: bw.wine,
          clientWine: bw.clientWines[0] || null,
        })),
      },
    })
  }
}
```

**2. Créer le validator `client_wine.ts`**
```typescript
import vine from '@vinejs/vine'

export const updateClientWineValidator = vine.compile(
  vine.object({
    status: vine.enum(['in_cellar', 'opened', 'finished']).optional(),
    rating: vine.number().min(1).max(5).optional().nullable(),
    personalNotes: vine.string().optional().nullable(),
  })
)
```

**3. Créer `client/wines_controller.ts`**
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import ClientWine from '#models/client_wine'
import { updateClientWineValidator } from '#validators/client_wine'

export default class ClientWinesController {
  /**
   * Liste tous les vins du client
   * GET /client/wines
   */
  async index({ auth, request, response }: HttpContext) {
    const client = auth.user!
    const { status, rated, page = 1, limit = 20 } = request.qs()

    const query = ClientWine.query()
      .where('clientId', client.id)
      .preload('boxWine', (bwQuery) => {
        bwQuery.preload('wine').preload('box')
      })
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (rated === 'true') {
      query.whereNotNull('rating')
    } else if (rated === 'false') {
      query.whereNull('rating')
    }

    const wines = await query.paginate(page, limit)

    return response.ok({
      wines: wines.all().map((cw) => ({
        id: cw.id,
        status: cw.status,
        rating: cw.rating,
        personalNotes: cw.personalNotes,
        openedAt: cw.openedAt,
        finishedAt: cw.finishedAt,
        wantsReorder: cw.wantsReorder,
        wine: {
          id: cw.boxWine.wine.id,
          name: cw.boxWine.wine.name,
          domain: cw.boxWine.wine.domain,
          vintage: cw.boxWine.wine.vintage,
          color: cw.boxWine.wine.color,
          photoUrl: cw.boxWine.wine.photoUrl,
        },
        boxMonth: cw.boxWine.box.month,
      })),
      meta: wines.getMeta(),
    })
  }

  /**
   * Détail d'un vin avec toutes les infos
   * GET /client/wines/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const client = auth.user!

    const clientWine = await ClientWine.query()
      .where('id', params.id)
      .where('clientId', client.id)
      .preload('boxWine', (bwQuery) => {
        bwQuery.preload('wine').preload('box', (boxQuery) => {
          boxQuery.preload('subscription', (subQuery) => {
            subQuery.preload('merchant', (mQuery) => {
              mQuery.preload('merchantProfile')
            })
          })
        })
      })
      .firstOrFail()

    return response.ok({
      clientWine: {
        id: clientWine.id,
        status: clientWine.status,
        rating: clientWine.rating,
        personalNotes: clientWine.personalNotes,
        openedAt: clientWine.openedAt,
        finishedAt: clientWine.finishedAt,
        wantsReorder: clientWine.wantsReorder,
        reorderRequestedAt: clientWine.reorderRequestedAt,
        createdAt: clientWine.createdAt,
        merchantNotes: clientWine.boxWine.merchantNotes,
        wine: clientWine.boxWine.wine,
        box: {
          month: clientWine.boxWine.box.month,
        },
        merchant: {
          shopName: clientWine.boxWine.box.subscription.merchant.merchantProfile?.shopName,
        },
      },
    })
  }

  /**
   * Modifier un vin (statut, rating, notes)
   * PATCH /client/wines/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const client = auth.user!
    const data = await request.validateUsing(updateClientWineValidator)

    const clientWine = await ClientWine.query()
      .where('id', params.id)
      .where('clientId', client.id)
      .firstOrFail()

    // Gérer les timestamps automatiques
    if (data.status === 'opened' && clientWine.status === 'in_cellar') {
      clientWine.openedAt = DateTime.now()
    }
    if (data.status === 'finished' && clientWine.status !== 'finished') {
      clientWine.finishedAt = DateTime.now()
    }

    clientWine.merge(data)
    await clientWine.save()

    return response.ok({
      clientWine: {
        id: clientWine.id,
        status: clientWine.status,
        rating: clientWine.rating,
        personalNotes: clientWine.personalNotes,
        openedAt: clientWine.openedAt,
        finishedAt: clientWine.finishedAt,
      },
    })
  }

  /**
   * Demander une re-commande
   * POST /client/wines/:id/reorder
   */
  async reorder({ auth, params, response }: HttpContext) {
    const client = auth.user!

    const clientWine = await ClientWine.query()
      .where('id', params.id)
      .where('clientId', client.id)
      .firstOrFail()

    if (clientWine.wantsReorder) {
      return response.badRequest({
        message: 'Vous avez déjà demandé ce vin',
      })
    }

    clientWine.wantsReorder = true
    clientWine.reorderRequestedAt = DateTime.now()
    await clientWine.save()

    // TODO: Notifier le caviste

    return response.ok({
      message: 'Demande de re-commande enregistrée',
      clientWine: {
        id: clientWine.id,
        wantsReorder: clientWine.wantsReorder,
      },
    })
  }
}
```

**4. Ajouter les routes**
```typescript
const ClientBoxesController = () => import('#controllers/client/boxes_controller')
const ClientWinesController = () => import('#controllers/client/wines_controller')

router.group(() => {
  router.get('/boxes', [ClientBoxesController, 'index'])
  router.get('/boxes/:id', [ClientBoxesController, 'show'])

  router.get('/wines', [ClientWinesController, 'index'])
  router.get('/wines/:id', [ClientWinesController, 'show'])
  router.patch('/wines/:id', [ClientWinesController, 'update'])
  router.post('/wines/:id/reorder', [ClientWinesController, 'reorder'])
})
  .prefix('/client')
  .middleware([middleware.auth(), middleware.role({ roles: ['client'] })])
```

#### Critères d'acceptation
- [ ] Le client peut voir ses box envoyées
- [ ] Le client peut voir le détail d'une box
- [ ] Le client peut voir tous ses vins
- [ ] Le client peut modifier rating/status/notes
- [ ] Le client peut demander une re-commande

---

### TICKET-3.3 : Frontend - Créer une box (Caviste)

**Priorité :** P0
**Statut :** [x] Terminé
**Dépend de :** TICKET-3.1

#### Description
Créer l'interface pour composer et envoyer une box.

#### Fichiers à créer
```
packages/app/app/(merchant)/boxes/
├── page.tsx
├── new/
│   └── page.tsx
├── [id]/
│   └── page.tsx
└── components/
    ├── box-card.tsx
    ├── box-builder.tsx
    └── wine-selector.tsx
```

#### Instructions détaillées

**1. Créer `wine-selector.tsx`**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Check } from 'lucide-react'
import Image from 'next/image'

interface Wine {
  id: string
  name: string
  domain?: string
  vintage?: number
  color?: string
  photoUrl?: string
}

interface WineSelectorProps {
  selectedWines: string[]
  onSelect: (wineId: string) => void
  onDeselect: (wineId: string) => void
  maxSelection?: number
}

export function WineSelector({
  selectedWines,
  onSelect,
  onDeselect,
  maxSelection = 2,
}: WineSelectorProps) {
  const [wines, setWines] = useState<Wine[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWines() {
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const res = await fetch(`/api/merchant/wines?${params}`)
      const data = await res.json()
      setWines(data.wines)
      setLoading(false)
    }

    const timeout = setTimeout(fetchWines, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const isSelected = (wineId: string) => selectedWines.includes(wineId)
  const canSelectMore = selectedWines.length < maxSelection

  const handleClick = (wine: Wine) => {
    if (isSelected(wine.id)) {
      onDeselect(wine.id)
    } else if (canSelectMore) {
      onSelect(wine.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans le catalogue..."
          className="pl-10"
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedWines.length} / {maxSelection} vins sélectionnés
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto">
        {wines.map((wine) => {
          const selected = isSelected(wine.id)
          const disabled = !selected && !canSelectMore

          return (
            <Card
              key={wine.id}
              className={`cursor-pointer transition-all ${
                selected
                  ? 'ring-2 ring-primary'
                  : disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => !disabled && handleClick(wine)}
            >
              <CardContent className="p-3 flex gap-3">
                <div className="w-12 h-16 relative bg-muted rounded overflow-hidden flex-shrink-0">
                  {wine.photoUrl ? (
                    <Image
                      src={wine.photoUrl}
                      alt={wine.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{wine.name}</h4>
                  {wine.domain && (
                    <p className="text-xs text-muted-foreground truncate">
                      {wine.domain}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    {wine.vintage && (
                      <span className="text-xs">{wine.vintage}</span>
                    )}
                    {wine.color && (
                      <Badge variant="outline" className="text-xs">
                        {wine.color}
                      </Badge>
                    )}
                  </div>
                </div>
                {selected && (
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
```

**2. Créer `box-builder.tsx`**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Send, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { WineSelector } from './wine-selector'
import Image from 'next/image'

interface BoxBuilderProps {
  clients: Array<{
    id: string
    client: { fullName: string; email: string }
  }>
  existingBox?: any
}

export function BoxBuilder({ clients, existingBox }: BoxBuilderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState(
    existingBox?.subscription?.id || ''
  )
  const [month, setMonth] = useState(
    existingBox?.month || new Date().toISOString().slice(0, 7)
  )
  const [selectedWineIds, setSelectedWineIds] = useState<string[]>(
    existingBox?.wines?.map((w: any) => w.wine.id) || []
  )
  const [wineNotes, setWineNotes] = useState<Record<string, string>>(
    existingBox?.wines?.reduce(
      (acc: any, w: any) => ({ ...acc, [w.wine.id]: w.merchantNotes || '' }),
      {}
    ) || {}
  )
  const [wines, setWines] = useState<any[]>([])

  // Charger les détails des vins sélectionnés
  useEffect(() => {
    async function fetchSelectedWines() {
      if (selectedWineIds.length === 0) {
        setWines([])
        return
      }

      const winePromises = selectedWineIds.map((id) =>
        fetch(`/api/merchant/wines/${id}`).then((r) => r.json())
      )
      const results = await Promise.all(winePromises)
      setWines(results.map((r) => r.wine))
    }

    fetchSelectedWines()
  }, [selectedWineIds])

  const handleSelectWine = (wineId: string) => {
    setSelectedWineIds([...selectedWineIds, wineId])
  }

  const handleDeselectWine = (wineId: string) => {
    setSelectedWineIds(selectedWineIds.filter((id) => id !== wineId))
    const newNotes = { ...wineNotes }
    delete newNotes[wineId]
    setWineNotes(newNotes)
  }

  const handleSave = async (send: boolean = false) => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client')
      return
    }
    if (selectedWineIds.length === 0) {
      toast.error('Veuillez sélectionner au moins un vin')
      return
    }

    setLoading(true)

    try {
      const payload = {
        subscriptionId: selectedClient,
        month,
        wines: selectedWineIds.map((id, index) => ({
          wineId: id,
          merchantNotes: wineNotes[id] || null,
          position: index + 1,
        })),
      }

      const url = existingBox
        ? `/api/merchant/boxes/${existingBox.id}`
        : '/api/merchant/boxes'

      const res = await fetch(url, {
        method: existingBox ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      const data = await res.json()

      if (send) {
        // Envoyer la box
        const sendRes = await fetch(`/api/merchant/boxes/${data.box.id}/send`, {
          method: 'POST',
        })

        if (!sendRes.ok) {
          const error = await sendRes.json()
          throw new Error(error.message)
        }

        toast.success('Box envoyée au client !')
      } else {
        toast.success('Box enregistrée')
      }

      router.push('/boxes')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Générer les options de mois (6 mois en arrière, 6 mois en avant)
  const monthOptions = []
  const now = new Date()
  for (let i = -6; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    monthOptions.push(date.toISOString().slice(0, 7))
  }

  return (
    <div className="space-y-6">
      {/* Client et mois */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de la box</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select
                value={selectedClient}
                onValueChange={setSelectedClient}
                disabled={!!existingBox}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.client.fullName} ({sub.client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mois *</Label>
              <Select
                value={month}
                onValueChange={setMonth}
                disabled={!!existingBox}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {new Date(m + '-01').toLocaleDateString('fr-FR', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sélection des vins */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner les vins</CardTitle>
        </CardHeader>
        <CardContent>
          <WineSelector
            selectedWines={selectedWineIds}
            onSelect={handleSelectWine}
            onDeselect={handleDeselectWine}
            maxSelection={2}
          />
        </CardContent>
      </Card>

      {/* Notes personnalisées pour chaque vin */}
      {wines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notes personnalisées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {wines.map((wine, index) => (
              <div key={wine.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 relative bg-muted rounded overflow-hidden flex-shrink-0">
                    {wine.photoUrl && (
                      <Image
                        src={wine.photoUrl}
                        alt={wine.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">
                      Vin {index + 1}: {wine.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {wine.domain} {wine.vintage}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => handleDeselectWine(wine.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={wineNotes[wine.id] || ''}
                  onChange={(e) =>
                    setWineNotes({ ...wineNotes, [wine.id]: e.target.value })
                  }
                  placeholder="Notes pour ce client (conseils de dégustation, accords mets, quand l'ouvrir...)"
                  rows={3}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => handleSave(false)}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Enregistrer brouillon
        </Button>
        <Button
          type="button"
          disabled={loading || selectedWineIds.length === 0}
          onClick={() => handleSave(true)}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Send className="mr-2 h-4 w-4" />
          Envoyer au client
        </Button>
      </div>
    </div>
  )
}
```

#### Critères d'acceptation
- [ ] Sélectionner un client dans la liste
- [ ] Choisir le mois
- [ ] Sélectionner 2 vins depuis le catalogue
- [ ] Ajouter des notes personnalisées par vin
- [ ] Enregistrer en brouillon
- [ ] Envoyer au client

---

### TICKET-3.4 : Frontend - Espace Client (Mes box)

**Priorité :** P0
**Statut :** [x] Terminé
**Dépend de :** TICKET-3.2

#### Description
Créer l'interface client pour voir ses box.

#### Fichiers à créer
```
packages/app/app/(client)/
├── page.tsx
├── boxes/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
└── components/
    └── box-card.tsx
```

#### Instructions détaillées

**1. Créer `page.tsx` (redirect)**
```tsx
import { redirect } from 'next/navigation'

export default function ClientHomePage() {
  redirect('/boxes')
}
```

**2. Créer `components/box-card.tsx`**
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'

interface BoxCardProps {
  box: {
    id: string
    month: string
    sentAt: string
    merchant: { shopName: string }
    wines: Array<{
      wine: {
        name: string
        photoUrl?: string
      }
      clientWine?: {
        rating?: number
        status: string
      }
    }>
    totalWines: number
    ratedWines: number
  }
}

export function BoxCard({ box }: BoxCardProps) {
  const allRated = box.ratedWines === box.totalWines

  return (
    <Link href={`/boxes/${box.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden">
        {/* Photos des vins */}
        <div className="flex h-32">
          {box.wines.slice(0, 2).map((wine, index) => (
            <div
              key={index}
              className="flex-1 relative bg-muted"
            >
              {wine.wine.photoUrl ? (
                <Image
                  src={wine.wine.photoUrl}
                  alt={wine.wine.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">
                {new Date(box.month + '-01').toLocaleDateString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {box.merchant.shopName}
              </p>
            </div>
            <Badge variant={allRated ? 'default' : 'secondary'}>
              {box.ratedWines}/{box.totalWines} notés
            </Badge>
          </div>

          <div className="mt-3 space-y-1">
            {box.wines.map((wine, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="truncate">{wine.wine.name}</span>
                {wine.clientWine?.rating && (
                  <span className="text-yellow-500">
                    {'★'.repeat(wine.clientWine.rating)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**3. Créer `boxes/page.tsx`**
```tsx
import { getSession } from '@/lib/auth'
import { BoxCard } from '../components/box-card'

async function getBoxes(token: string) {
  const res = await fetch(`${process.env.API_URL}/client/boxes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export default async function ClientBoxesPage() {
  const session = await getSession()
  const { boxes } = await getBoxes(session!.token)

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Mes box</h1>

      {boxes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Vous n'avez pas encore reçu de box.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {boxes.map((box: any) => (
            <BoxCard key={box.id} box={box} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**4. Créer `boxes/[id]/page.tsx`**
```tsx
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getBox(token: string, id: string) {
  const res = await fetch(`${process.env.API_URL}/client/boxes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export default async function BoxDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getSession()
  const data = await getBox(session!.token, params.id)

  if (!data) {
    notFound()
  }

  const { box } = data

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/boxes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            Box {new Date(box.month + '-01').toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {box.merchant.shopName}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {box.wines.map((item: any) => (
          <Link key={item.id} href={`/cave/${item.clientWine?.id}`}>
            <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
              <div className="flex">
                <div className="w-24 h-32 relative bg-muted flex-shrink-0">
                  {item.wine.photoUrl ? (
                    <Image
                      src={item.wine.photoUrl}
                      alt={item.wine.name}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <CardContent className="p-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.wine.name}</h3>
                      {item.wine.domain && (
                        <p className="text-sm text-muted-foreground">
                          {item.wine.domain}
                        </p>
                      )}
                    </div>
                    {item.clientWine?.rating && (
                      <Badge>
                        {'★'.repeat(item.clientWine.rating)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    {item.wine.vintage && (
                      <Badge variant="outline">{item.wine.vintage}</Badge>
                    )}
                    {item.wine.color && (
                      <Badge variant="outline">{item.wine.color}</Badge>
                    )}
                  </div>

                  {item.clientWine && (
                    <div className="mt-2">
                      <Badge
                        variant={
                          item.clientWine.status === 'in_cellar'
                            ? 'secondary'
                            : item.clientWine.status === 'opened'
                            ? 'default'
                            : 'outline'
                        }
                      >
                        {item.clientWine.status === 'in_cellar' && 'En cave'}
                        {item.clientWine.status === 'opened' && 'Ouverte'}
                        {item.clientWine.status === 'finished' && 'Terminée'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

#### Critères d'acceptation
- [ ] Voir la liste des box reçues
- [ ] Voir le détail d'une box
- [ ] Naviguer vers le détail d'un vin

---

### TICKET-3.5 : Frontend - Détail vin & notation (Client)

**Priorité :** P0
**Statut :** [x] Terminé
**Dépend de :** TICKET-3.4

#### Description
Créer la vue détaillée d'un vin avec possibilité de noter et commenter.

#### Fichiers à créer
```
packages/app/app/(client)/cave/
├── page.tsx
├── [id]/
│   └── page.tsx
└── components/
    ├── wine-detail.tsx
    ├── rating-input.tsx
    └── status-select.tsx
```

#### Instructions détaillées

**1. Créer `rating-input.tsx`**
```tsx
'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingInputProps {
  value: number | null
  onChange: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export function RatingInput({ value, onChange, size = 'md' }: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => {
        const filled = (hovered ?? value ?? 0) >= rating

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            onMouseEnter={() => setHovered(rating)}
            onMouseLeave={() => setHovered(null)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                sizes[size],
                'transition-colors',
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
```

**2. Créer `status-select.tsx`**
```tsx
'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Wine, GlassWater, CheckCircle } from 'lucide-react'

interface StatusSelectProps {
  value: string
  onChange: (status: string) => void
}

const statuses = [
  { value: 'in_cellar', label: 'En cave', icon: Wine },
  { value: 'opened', label: 'Ouverte', icon: GlassWater },
  { value: 'finished', label: 'Terminée', icon: CheckCircle },
]

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  const current = statuses.find((s) => s.value === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          {current && (
            <div className="flex items-center gap-2">
              <current.icon className="h-4 w-4" />
              {current.label}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            <div className="flex items-center gap-2">
              <status.icon className="h-4 w-4" />
              {status.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

**3. Créer `cave/[id]/page.tsx`**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, RotateCcw, Save } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { RatingInput } from '../components/rating-input'
import { StatusSelect } from '../components/status-select'

export default function WineDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<any>(null)

  const [status, setStatus] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function fetchWine() {
      const res = await fetch(`/api/client/wines/${params.id}`)
      const json = await res.json()
      setData(json.clientWine)
      setStatus(json.clientWine.status)
      setRating(json.clientWine.rating)
      setNotes(json.clientWine.personalNotes || '')
      setLoading(false)
    }
    fetchWine()
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/client/wines/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rating,
          personalNotes: notes || null,
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la sauvegarde')

      toast.success('Modifications enregistrées')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleReorder = async () => {
    try {
      const res = await fetch(`/api/client/wines/${params.id}/reorder`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      toast.success('Demande envoyée à votre caviste')
      // Refresh data
      const refreshRes = await fetch(`/api/client/wines/${params.id}`)
      const json = await refreshRes.json()
      setData(json.clientWine)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const wine = data.wine

  return (
    <div className="pb-20">
      {/* Header avec photo */}
      <div className="relative">
        <div className="h-64 bg-muted relative">
          {wine.photoUrl && (
            <Image
              src={wine.photoUrl}
              alt={wine.name}
              fill
              className="object-cover"
            />
          )}
        </div>
        <Link href="/cave" className="absolute top-4 left-4">
          <Button variant="secondary" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="p-4 space-y-6">
        {/* Titre */}
        <div>
          <h1 className="text-2xl font-bold">{wine.name}</h1>
          {wine.domain && (
            <p className="text-muted-foreground">{wine.domain}</p>
          )}
          <div className="flex gap-2 mt-2">
            {wine.vintage && <Badge variant="outline">{wine.vintage}</Badge>}
            {wine.color && <Badge variant="outline">{wine.color}</Badge>}
            {wine.region && <Badge variant="outline">{wine.region}</Badge>}
          </div>
        </div>

        <Separator />

        {/* Statut et notation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Statut</span>
            <StatusSelect value={status} onChange={setStatus} />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Ma note</span>
            <RatingInput
              value={rating}
              onChange={setRating}
              size="lg"
            />
          </div>
        </div>

        <Separator />

        {/* Notes du caviste */}
        {data.merchantNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Notes de {data.merchant.shopName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {data.merchantNotes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Infos du vin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wine.grapes && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cépages</span>
                <span>{wine.grapes}</span>
              </div>
            )}
            {wine.alcoholDegree && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Alcool</span>
                <span>{wine.alcoholDegree}%</span>
              </div>
            )}
            {(wine.guardMin || wine.guardMax) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Garde</span>
                <span>
                  {wine.guardMin && wine.guardMax
                    ? `${wine.guardMin}-${wine.guardMax} ans`
                    : wine.guardMin
                    ? `Min. ${wine.guardMin} ans`
                    : `Max. ${wine.guardMax} ans`}
                </span>
              </div>
            )}
            {wine.aromas && wine.aromas.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Arômes</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {wine.aromas.map((aroma: string) => (
                    <Badge key={aroma} variant="secondary">
                      {aroma}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {wine.foodPairings && wine.foodPairings.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">
                  Accords mets
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {wine.foodPairings.map((pairing: string) => (
                    <Badge key={pairing} variant="secondary">
                      {pairing}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mes notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mes notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mes impressions, avec quoi je l'ai dégusté..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReorder}
            disabled={data.wantsReorder}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {data.wantsReorder ? 'Demande envoyée' : 'J\'en reveux !'}
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### Critères d'acceptation
- [ ] Voir toutes les infos du vin
- [ ] Voir les notes du caviste
- [ ] Changer le statut (en cave/ouvert/terminé)
- [ ] Noter de 1 à 5 étoiles
- [ ] Ajouter des notes personnelles
- [ ] Demander une re-commande

---

## Résumé Phase 3

| Ticket | Description | Priorité | Statut |
|--------|-------------|----------|--------|
| 3.1 | API CRUD Box | P0 | [x] |
| 3.2 | API Espace Client | P0 | [x] |
| 3.3 | Frontend Créer box | P0 | [x] |
| 3.4 | Frontend Mes box (client) | P0 | [x] |
| 3.5 | Frontend Détail vin & notation | P0 | [x] |

**Definition of Done Phase 3 :**
- [x] Le caviste peut créer une box avec 2 vins
- [x] Le caviste peut ajouter des notes personnalisées
- [x] Le caviste peut envoyer la box
- [x] Le client peut voir ses box reçues
- [x] Le client peut voir le détail d'un vin
- [x] Le client peut noter et commenter un vin
- [x] Le client peut demander une re-commande
