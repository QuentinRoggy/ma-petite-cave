import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Wine, Package, TrendingUp, Plus, RotateCcw, Star } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

type RecentFeedback = {
  id: number
  rating: number
  personalNotes: string | null
  updatedAt: string
  client: {
    fullName: string | null
  }
  wine: {
    name: string
  }
}

async function getStats() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const [clientsRes, winesRes, feedbackRes, reordersRes] = await Promise.all([
      fetch(`${API_URL}/merchant/clients/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/merchant/wines/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/merchant/feedback/recent`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/merchant/reorders/count`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ])

    return {
      clients: clientsRes.ok ? await clientsRes.json() : null,
      wines: winesRes.ok ? await winesRes.json() : null,
      feedback: feedbackRes.ok ? await feedbackRes.json() : null,
      reorders: reordersRes.ok ? await reordersRes.json() : null,
    }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const data = await getStats()
  const clientStats = data?.clients?.stats || { total: 0, active: 0, withBoxThisMonth: 0 }
  const wineStats = data?.wines?.stats || { total: 0, byColor: {} }
  const recentFeedbacks: RecentFeedback[] = data?.feedback?.feedbacks || []
  const reorderCount = data?.reorders?.count || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble de votre activité</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/wines/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau vin
            </Link>
          </Button>
        </div>
      </div>

      {/* Reorders alert */}
      {reorderCount > 0 && (
        <Link href="/reorders">
          <Card className="border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">
                    {reorderCount} demande{reorderCount > 1 ? 's' : ''} de re-commande
                  </p>
                  <p className="text-sm text-orange-700">Cliquez pour voir les détails</p>
                </div>
              </div>
              <Button variant="outline" className="border-orange-300 hover:bg-orange-100">
                Voir
              </Button>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.active}</div>
            <p className="text-xs text-muted-foreground">sur {clientStats.total} au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Box ce mois</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.withBoxThisMonth}</div>
            <p className="text-xs text-muted-foreground">clients servis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catalogue vins</CardTitle>
            <Wine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wineStats.total}</div>
            <p className="text-xs text-muted-foreground">références</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Répartition</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {Object.keys(wineStats.byColor).length > 0 ? (
                Object.entries(wineStats.byColor).map(([color, count]) => (
                  <div key={color} className="flex justify-between">
                    <span className="capitalize">{color}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions & Recent feedback */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/shipments/new" className="block">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Derniers feedbacks</CardTitle>
            <Link href="/feedback">
              <Button variant="ghost" size="sm">
                Tout voir
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentFeedbacks.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Les notes de vos clients apparaîtront ici.
              </p>
            ) : (
              <div className="space-y-3">
                {recentFeedbacks.map((fb) => (
                  <div key={fb.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fb.wine.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fb.client.fullName || 'Client'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
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
      </div>
    </div>
  )
}
