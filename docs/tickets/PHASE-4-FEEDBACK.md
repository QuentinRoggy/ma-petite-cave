# Phase 4 : Boucle de Feedback

> Durée estimée : Semaine 4
> Objectif : Permettre au caviste de voir les retours clients et finaliser le MVP

---

## Vue d'ensemble

Cette phase ferme la boucle de feedback :
- Le caviste peut voir les notes et commentaires de ses clients
- Le caviste peut voir les demandes de re-commande
- Notifications in-app basiques
- Polish et préparation de la démo

---

## Tickets

### TICKET-4.1 : API - Feedback clients pour le caviste

**Priorité :** P0
**Statut :** [x] Terminé
**Dépend de :** Phase 3 complète

#### Description
Créer les endpoints pour que le caviste puisse voir les retours de ses clients.

#### Fichiers à créer/modifier
```
packages/api/app/controllers/merchant/
├── feedback_controller.ts
└── reorders_controller.ts
```

#### Instructions détaillées

**1. Créer `feedback_controller.ts`**
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import ClientWine from '#models/client_wine'
import BoxWine from '#models/box_wine'
import Box from '#models/box'

export default class FeedbackController {
  /**
   * Liste tous les feedbacks récents
   * GET /merchant/feedback
   */
  async index({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const { page = 1, limit = 20, clientId } = request.qs()

    const query = ClientWine.query()
      .whereNotNull('rating') // Seulement les vins notés
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereHas('subscription', (subQuery) => {
            subQuery.where('merchantId', merchant.id)
            if (clientId) {
              subQuery.where('clientId', clientId)
            }
          })
        })
      })
      .preload('client')
      .preload('boxWine', (bwQuery) => {
        bwQuery.preload('wine').preload('box')
      })
      .orderBy('updatedAt', 'desc')

    const feedbacks = await query.paginate(page, limit)

    return response.ok({
      feedbacks: feedbacks.all().map((cw) => ({
        id: cw.id,
        rating: cw.rating,
        personalNotes: cw.personalNotes,
        status: cw.status,
        updatedAt: cw.updatedAt,
        client: {
          id: cw.client.id,
          fullName: cw.client.fullName,
          email: cw.client.email,
        },
        wine: {
          id: cw.boxWine.wine.id,
          name: cw.boxWine.wine.name,
          domain: cw.boxWine.wine.domain,
          vintage: cw.boxWine.wine.vintage,
          photoUrl: cw.boxWine.wine.photoUrl,
        },
        box: {
          month: cw.boxWine.box.month,
        },
      })),
      meta: feedbacks.getMeta(),
    })
  }

  /**
   * Stats des feedbacks
   * GET /merchant/feedback/stats
   */
  async stats({ auth, response }: HttpContext) {
    const merchant = auth.user!

    // Récupérer tous les ClientWine du merchant
    const clientWines = await ClientWine.query()
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereHas('subscription', (subQuery) => {
            subQuery.where('merchantId', merchant.id)
          })
        })
      })
      .select('rating', 'status')

    const total = clientWines.length
    const rated = clientWines.filter((cw) => cw.rating !== null).length
    const avgRating = clientWines
      .filter((cw) => cw.rating !== null)
      .reduce((sum, cw) => sum + (cw.rating || 0), 0) / (rated || 1)

    const byRating = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: clientWines.filter((cw) => cw.rating === r).length,
    }))

    const byStatus = {
      in_cellar: clientWines.filter((cw) => cw.status === 'in_cellar').length,
      opened: clientWines.filter((cw) => cw.status === 'opened').length,
      finished: clientWines.filter((cw) => cw.status === 'finished').length,
    }

    return response.ok({
      stats: {
        total,
        rated,
        ratingRate: total > 0 ? Math.round((rated / total) * 100) : 0,
        avgRating: Math.round(avgRating * 10) / 10,
        byRating,
        byStatus,
      },
    })
  }

  /**
   * Feedbacks récents pour le dashboard
   * GET /merchant/feedback/recent
   */
  async recent({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const feedbacks = await ClientWine.query()
      .whereNotNull('rating')
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereHas('subscription', (subQuery) => {
            subQuery.where('merchantId', merchant.id)
          })
        })
      })
      .preload('client')
      .preload('boxWine', (bwQuery) => {
        bwQuery.preload('wine')
      })
      .orderBy('updatedAt', 'desc')
      .limit(5)

    return response.ok({
      feedbacks: feedbacks.map((cw) => ({
        id: cw.id,
        rating: cw.rating,
        personalNotes: cw.personalNotes,
        updatedAt: cw.updatedAt,
        client: {
          fullName: cw.client.fullName,
        },
        wine: {
          name: cw.boxWine.wine.name,
        },
      })),
    })
  }
}
```

**2. Créer `reorders_controller.ts`**
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import ClientWine from '#models/client_wine'

export default class ReordersController {
  /**
   * Liste les demandes de re-commande
   * GET /merchant/reorders
   */
  async index({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const { page = 1, limit = 20, handled } = request.qs()

    const query = ClientWine.query()
      .where('wantsReorder', true)
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereHas('subscription', (subQuery) => {
            subQuery.where('merchantId', merchant.id)
          })
        })
      })
      .preload('client')
      .preload('boxWine', (bwQuery) => {
        bwQuery.preload('wine')
      })
      .orderBy('reorderRequestedAt', 'desc')

    const reorders = await query.paginate(page, limit)

    return response.ok({
      reorders: reorders.all().map((cw) => ({
        id: cw.id,
        requestedAt: cw.reorderRequestedAt,
        rating: cw.rating,
        personalNotes: cw.personalNotes,
        client: {
          id: cw.clientId,
          fullName: cw.client.fullName,
          email: cw.client.email,
        },
        wine: {
          id: cw.boxWine.wine.id,
          name: cw.boxWine.wine.name,
          domain: cw.boxWine.wine.domain,
          vintage: cw.boxWine.wine.vintage,
          photoUrl: cw.boxWine.wine.photoUrl,
        },
      })),
      meta: reorders.getMeta(),
    })
  }

  /**
   * Nombre de demandes en attente
   * GET /merchant/reorders/count
   */
  async count({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const count = await ClientWine.query()
      .where('wantsReorder', true)
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereHas('subscription', (subQuery) => {
            subQuery.where('merchantId', merchant.id)
          })
        })
      })
      .count('* as total')

    return response.ok({
      count: Number(count[0].$extras.total),
    })
  }
}
```

**3. Ajouter les routes**
```typescript
const FeedbackController = () => import('#controllers/merchant/feedback_controller')
const ReordersController = () => import('#controllers/merchant/reorders_controller')

router.group(() => {
  // ... autres routes

  // Feedback
  router.get('/feedback', [FeedbackController, 'index'])
  router.get('/feedback/stats', [FeedbackController, 'stats'])
  router.get('/feedback/recent', [FeedbackController, 'recent'])

  // Re-commandes
  router.get('/reorders', [ReordersController, 'index'])
  router.get('/reorders/count', [ReordersController, 'count'])
})
  .prefix('/merchant')
  .middleware([middleware.auth(), middleware.role({ roles: ['merchant'] })])
```

#### Critères d'acceptation
- [ ] Lister tous les feedbacks avec pagination
- [ ] Stats des feedbacks (taux de notation, moyenne, distribution)
- [ ] Feedbacks récents pour le dashboard
- [ ] Lister les demandes de re-commande
- [ ] Compter les demandes en attente

---

### TICKET-4.2 : Frontend - Vue feedback (Caviste)

**Priorité :** P1
**Statut :** [x] Terminé
**Dépend de :** TICKET-4.1

#### Description
Créer les interfaces pour visualiser les retours clients.

#### Fichiers à créer
```
packages/app/app/(merchant)/
├── feedback/
│   └── page.tsx
├── reorders/
│   └── page.tsx
└── components/
    ├── feedback-card.tsx
    └── reorder-card.tsx
```

#### Instructions détaillées

**1. Créer `feedback-card.tsx`**
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Image from 'next/image'
import { Star } from 'lucide-react'

interface FeedbackCardProps {
  feedback: {
    id: string
    rating: number
    personalNotes?: string
    updatedAt: string
    client: {
      fullName: string
      email: string
    }
    wine: {
      name: string
      domain?: string
      vintage?: number
      photoUrl?: string
    }
    box: {
      month: string
    }
  }
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Photo du vin */}
          <div className="w-16 h-20 relative bg-muted rounded overflow-hidden flex-shrink-0">
            {feedback.wine.photoUrl && (
              <Image
                src={feedback.wine.photoUrl}
                alt={feedback.wine.name}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium truncate">{feedback.wine.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {feedback.client.fullName}
                </p>
              </div>
              <div className="flex items-center text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < feedback.rating ? 'fill-current' : 'text-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {feedback.personalNotes && (
              <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                "{feedback.personalNotes}"
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(feedback.updatedAt), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**2. Créer `feedback/page.tsx`**
```tsx
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FeedbackCard } from '../components/feedback-card'
import { Star, TrendingUp, Users, Wine } from 'lucide-react'

async function getFeedback(token: string) {
  const [feedbackRes, statsRes] = await Promise.all([
    fetch(`${process.env.API_URL}/merchant/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${process.env.API_URL}/merchant/feedback/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ])

  return {
    feedbacks: await feedbackRes.json(),
    stats: await statsRes.json(),
  }
}

export default async function FeedbackPage() {
  const session = await getSession()
  const { feedbacks, stats } = await getFeedback(session!.token)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feedback clients</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vins notés</CardTitle>
            <Wine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats.rated}</div>
            <p className="text-xs text-muted-foreground">
              sur {stats.stats.total} distribués ({stats.stats.ratingRate}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.stats.avgRating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Distribution</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats.stats.byRating.reverse().map((r: any) => (
                <div key={r.rating} className="flex items-center gap-2 text-sm">
                  <span className="w-4">{r.rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${(r.count / stats.stats.rated) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Statut vins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>En cave</span>
                <span className="font-medium">{stats.stats.byStatus.in_cellar}</span>
              </div>
              <div className="flex justify-between">
                <span>Ouverts</span>
                <span className="font-medium">{stats.stats.byStatus.opened}</span>
              </div>
              <div className="flex justify-between">
                <span>Terminés</span>
                <span className="font-medium">{stats.stats.byStatus.finished}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des feedbacks */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Derniers avis</h2>
        {feedbacks.feedbacks.length === 0 ? (
          <p className="text-muted-foreground">
            Aucun feedback pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {feedbacks.feedbacks.map((feedback: any) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**3. Créer `reorders/page.tsx`**
```tsx
import { getSession } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RotateCcw, Star } from 'lucide-react'

async function getReorders(token: string) {
  const res = await fetch(`${process.env.API_URL}/merchant/reorders`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export default async function ReordersPage() {
  const session = await getSession()
  const { reorders } = await getReorders(session!.token)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <RotateCcw className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Demandes de re-commande</h1>
        {reorders.length > 0 && (
          <Badge variant="destructive">{reorders.length}</Badge>
        )}
      </div>

      {reorders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucune demande de re-commande pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reorders.map((reorder: any) => (
            <Card key={reorder.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Photo du vin */}
                  <div className="w-20 h-28 relative bg-muted rounded overflow-hidden flex-shrink-0">
                    {reorder.wine.photoUrl && (
                      <Image
                        src={reorder.wine.photoUrl}
                        alt={reorder.wine.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{reorder.wine.name}</h3>
                        {reorder.wine.domain && (
                          <p className="text-sm text-muted-foreground">
                            {reorder.wine.domain} {reorder.wine.vintage}
                          </p>
                        )}
                      </div>
                      {reorder.rating && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{reorder.rating}</span>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </div>
                      )}
                    </div>

                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        {reorder.client.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reorder.client.email}
                      </p>
                      {reorder.personalNotes && (
                        <p className="text-sm mt-2 italic">
                          "{reorder.personalNotes}"
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <p className="text-xs text-muted-foreground">
                        Demandé{' '}
                        {formatDistanceToNow(new Date(reorder.requestedAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                      <Link href={`/clients/${reorder.client.id}`}>
                        <Button variant="outline" size="sm">
                          Voir le client
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### Critères d'acceptation
- [ ] Page feedback avec stats et liste
- [ ] Page re-commandes avec liste
- [ ] Navigation vers fiche client depuis re-commande

---

### TICKET-4.3 : Améliorer le Dashboard avec feedback

**Priorité :** P1
**Statut :** [x] Terminé
**Dépend de :** TICKET-4.1

#### Description
Enrichir le dashboard caviste avec les feedbacks récents et les re-commandes.

#### Fichiers à modifier
```
packages/app/app/(merchant)/dashboard/page.tsx
```

#### Instructions détaillées

Ajouter au dashboard existant :

```tsx
// Ajouter les imports
import { Star, RotateCcw } from 'lucide-react'
import Link from 'next/link'

// Ajouter les fetch
async function getDashboardData(token: string) {
  const [clientsRes, winesRes, feedbackRes, reordersRes] = await Promise.all([
    fetch(`${process.env.API_URL}/merchant/clients/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${process.env.API_URL}/merchant/wines/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${process.env.API_URL}/merchant/feedback/recent`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${process.env.API_URL}/merchant/reorders/count`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ])

  return {
    clients: await clientsRes.json(),
    wines: await winesRes.json(),
    feedback: await feedbackRes.json(),
    reorders: await reordersRes.json(),
  }
}

// Ajouter dans le JSX après les cards stats existantes :

{/* Reorders alert */}
{reorders.count > 0 && (
  <Link href="/reorders">
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw className="h-5 w-5 text-orange-600" />
          <div>
            <p className="font-medium text-orange-900">
              {reorders.count} demande{reorders.count > 1 ? 's' : ''} de re-commande
            </p>
            <p className="text-sm text-orange-700">
              Cliquez pour voir les détails
            </p>
          </div>
        </div>
        <Button variant="outline" className="border-orange-300">
          Voir
        </Button>
      </CardContent>
    </Card>
  </Link>
)}

{/* Recent feedback */}
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>Derniers feedbacks</CardTitle>
    <Link href="/feedback">
      <Button variant="ghost" size="sm">Tout voir</Button>
    </Link>
  </CardHeader>
  <CardContent>
    {feedback.feedbacks.length === 0 ? (
      <p className="text-muted-foreground text-sm">
        Les notes de vos clients apparaîtront ici.
      </p>
    ) : (
      <div className="space-y-3">
        {feedback.feedbacks.map((fb: any) => (
          <div key={fb.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {fb.wine.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {fb.client.fullName}
              </p>
            </div>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < fb.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

#### Critères d'acceptation
- [ ] Alerte visuelle si re-commandes en attente
- [ ] Liste des 5 derniers feedbacks
- [ ] Liens vers les pages détaillées

---

### TICKET-4.4 : Ajouter Feedback et Reorders à la sidebar

**Priorité :** P2
**Statut :** [x] Terminé
**Dépend de :** TICKET-4.2

#### Description
Ajouter les liens vers Feedback et Re-commandes dans la navigation caviste.

#### Fichiers à modifier
```
packages/app/app/(merchant)/components/merchant-sidebar.tsx
```

#### Instructions détaillées

```tsx
// Ajouter les imports
import { MessageSquare, RotateCcw } from 'lucide-react'

// Modifier la navigation
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Catalogue', href: '/wines', icon: Wine },
  { name: 'Box', href: '/boxes', icon: Package },
  { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  { name: 'Re-commandes', href: '/reorders', icon: RotateCcw },
]
```

Pour afficher un badge sur les re-commandes si il y en a :

```tsx
// Dans le composant, ajouter un state pour le count
const [reorderCount, setReorderCount] = useState(0)

useEffect(() => {
  async function fetchCount() {
    const res = await fetch('/api/merchant/reorders/count')
    const data = await res.json()
    setReorderCount(data.count)
  }
  fetchCount()
}, [])

// Dans le rendu du lien Re-commandes :
<Link
  href="/reorders"
  className={cn(/* ... */)}
>
  <RotateCcw className="h-5 w-5" />
  Re-commandes
  {reorderCount > 0 && (
    <Badge variant="destructive" className="ml-auto">
      {reorderCount}
    </Badge>
  )}
</Link>
```

#### Critères d'acceptation
- [ ] Liens visibles dans la sidebar
- [ ] Badge sur Re-commandes si > 0

---

### TICKET-4.5 : Page Ma Cave (Client)

**Priorité :** P1
**Statut :** [x] Terminé (fait en Phase 3)
**Dépend de :** Phase 3 complète

#### Description
Créer la page "Ma Cave" pour le client avec tous ses vins.

#### Fichiers à créer
```
packages/app/app/(client)/cave/
├── page.tsx
└── components/
    └── cave-wine-card.tsx
```

#### Instructions détaillées

**1. Créer `cave-wine-card.tsx`**
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'

interface CaveWineCardProps {
  wine: {
    id: string
    status: string
    rating?: number
    wine: {
      name: string
      domain?: string
      vintage?: number
      color?: string
      photoUrl?: string
    }
    boxMonth: string
  }
}

const statusLabels = {
  in_cellar: 'En cave',
  opened: 'Ouverte',
  finished: 'Terminée',
}

const statusColors = {
  in_cellar: 'bg-blue-100 text-blue-800',
  opened: 'bg-green-100 text-green-800',
  finished: 'bg-gray-100 text-gray-800',
}

export function CaveWineCard({ wine }: CaveWineCardProps) {
  return (
    <Link href={`/cave/${wine.id}`}>
      <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
        <div className="flex">
          <div className="w-20 h-28 relative bg-muted flex-shrink-0">
            {wine.wine.photoUrl && (
              <Image
                src={wine.wine.photoUrl}
                alt={wine.wine.name}
                fill
                className="object-cover"
              />
            )}
          </div>
          <CardContent className="p-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-medium text-sm line-clamp-1">
                {wine.wine.name}
              </h3>
              {wine.wine.domain && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {wine.wine.domain}
                </p>
              )}
              <div className="flex gap-1 mt-1">
                {wine.wine.vintage && (
                  <Badge variant="outline" className="text-xs">
                    {wine.wine.vintage}
                  </Badge>
                )}
                {wine.wine.color && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {wine.wine.color}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <Badge className={statusColors[wine.status as keyof typeof statusColors]}>
                {statusLabels[wine.status as keyof typeof statusLabels]}
              </Badge>
              {wine.rating && (
                <div className="flex items-center gap-0.5">
                  {[...Array(wine.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  )
}
```

**2. Créer `cave/page.tsx`**
```tsx
import { getSession } from '@/lib/auth'
import { CaveWineCard } from './components/cave-wine-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Wine, GlassWater, CheckCircle } from 'lucide-react'

async function getWines(token: string) {
  const res = await fetch(`${process.env.API_URL}/client/wines`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export default async function CavePage() {
  const session = await getSession()
  const { wines } = await getWines(session!.token)

  const inCellar = wines.filter((w: any) => w.status === 'in_cellar')
  const opened = wines.filter((w: any) => w.status === 'opened')
  const finished = wines.filter((w: any) => w.status === 'finished')

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Ma Cave</h1>

      <Tabs defaultValue="in_cellar">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="in_cellar" className="gap-1">
            <Wine className="h-4 w-4" />
            <span className="hidden sm:inline">En cave</span>
            <span className="text-xs">({inCellar.length})</span>
          </TabsTrigger>
          <TabsTrigger value="opened" className="gap-1">
            <GlassWater className="h-4 w-4" />
            <span className="hidden sm:inline">Ouvertes</span>
            <span className="text-xs">({opened.length})</span>
          </TabsTrigger>
          <TabsTrigger value="finished" className="gap-1">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Terminées</span>
            <span className="text-xs">({finished.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in_cellar" className="mt-4">
          {inCellar.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun vin en cave
            </p>
          ) : (
            <div className="grid gap-3">
              {inCellar.map((wine: any) => (
                <CaveWineCard key={wine.id} wine={wine} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="opened" className="mt-4">
          {opened.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun vin ouvert
            </p>
          ) : (
            <div className="grid gap-3">
              {opened.map((wine: any) => (
                <CaveWineCard key={wine.id} wine={wine} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="finished" className="mt-4">
          {finished.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun vin terminé
            </p>
          ) : (
            <div className="grid gap-3">
              {finished.map((wine: any) => (
                <CaveWineCard key={wine.id} wine={wine} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### Critères d'acceptation
- [ ] Voir tous mes vins
- [ ] Filtrer par statut (tabs)
- [ ] Voir le rating
- [ ] Naviguer vers le détail

---

### TICKET-4.6 : Tests et corrections

**Priorité :** P0
**Statut :** [ ] À faire
**Dépend de :** Tous les tickets précédents

#### Description
Tester l'ensemble du flow et corriger les bugs.

#### Checklist de test

**Flow Caviste :**
- [ ] Inscription en tant que merchant
- [ ] Connexion → redirection vers dashboard
- [ ] Créer un client
- [ ] Ajouter des vins au catalogue
- [ ] Créer une box avec 2 vins
- [ ] Ajouter des notes personnalisées
- [ ] Envoyer la box
- [ ] Voir le feedback (après notation client)
- [ ] Voir les re-commandes

**Flow Client :**
- [ ] Se connecter (compte créé par caviste)
- [ ] Connexion → redirection vers boxes
- [ ] Voir la box reçue
- [ ] Voir le détail d'un vin
- [ ] Changer le statut du vin
- [ ] Noter le vin
- [ ] Ajouter des notes personnelles
- [ ] Demander une re-commande
- [ ] Voir Ma Cave avec filtres

**Responsive :**
- [ ] Dashboard caviste sur desktop
- [ ] Catalogue vins sur tablette
- [ ] Espace client sur mobile

**Erreurs :**
- [ ] Gestion des 404
- [ ] Messages d'erreur clairs
- [ ] Validation des formulaires

---

### TICKET-4.7 : Préparation démo

**Priorité :** P1
**Statut :** [ ] À faire
**Dépend de :** TICKET-4.6

#### Description
Préparer les données et le scénario pour la démo au caviste.

#### Checklist

**Données de démo :**
- [ ] Un compte caviste avec les infos de la cave
- [ ] Un compte client (toi)
- [ ] 5-10 vins dans le catalogue avec photos
- [ ] 2-3 box envoyées
- [ ] Quelques notes et ratings

**Scénario de démo :**

1. **Introduction (2 min)**
   - Expliquer le problème (infos orales oubliées)
   - Expliquer la solution

2. **Démo caviste (5 min)**
   - Montrer le dashboard
   - Montrer le catalogue de vins
   - Créer une nouvelle box en live
   - Montrer les notes personnalisées

3. **Démo client (5 min)**
   - Sur téléphone
   - Ouvrir l'app, voir la box
   - Montrer les infos détaillées
   - Noter un vin
   - Demander une re-commande

4. **Boucle de feedback (2 min)**
   - Retour sur l'interface caviste
   - Montrer la notification de feedback
   - Montrer la demande de re-commande

5. **Discussion (5 min)**
   - Recueillir les retours
   - Identifier les manques
   - Discuter des prochaines étapes

---

## Résumé Phase 4

| Ticket | Description | Priorité | Statut |
|--------|-------------|----------|--------|
| 4.1 | API Feedback | P0 | [x] |
| 4.2 | Frontend Feedback | P1 | [x] |
| 4.3 | Dashboard enrichi | P1 | [x] |
| 4.4 | Navigation sidebar | P2 | [x] |
| 4.5 | Page Ma Cave | P1 | [x] |
| 4.6 | Tests et corrections | P0 | [ ] |
| 4.7 | Préparation démo | P1 | [ ] |

**Definition of Done Phase 4 :**
- [x] Le caviste peut voir les notes de ses clients
- [x] Le caviste peut voir les demandes de re-commande
- [x] Le dashboard affiche les feedbacks récents
- [ ] L'app est testée et fonctionnelle
- [ ] La démo est prête

---

## MVP Complet - Checklist finale

### Fonctionnalités

- [ ] **Auth** : Inscription/connexion avec rôles (merchant/client)
- [ ] **Caviste - Clients** : CRUD complet
- [ ] **Caviste - Catalogue** : CRUD avec champs enrichis
- [ ] **Caviste - Box** : Création, édition, envoi
- [ ] **Caviste - Feedback** : Visualisation des notes
- [ ] **Caviste - Reorders** : Liste des demandes
- [ ] **Client - Boxes** : Voir les box reçues
- [ ] **Client - Vins** : Détail avec infos caviste
- [ ] **Client - Notation** : Rating + notes + statut
- [ ] **Client - Cave** : Vue globale avec filtres

### Technique

- [ ] Migrations DB passées
- [ ] API fonctionnelle
- [ ] Frontend responsive
- [ ] Gestion des erreurs
- [ ] Pas de bugs bloquants

### Démo

- [ ] Données de test prêtes
- [ ] Scénario de démo préparé
- [ ] Environnement stable
