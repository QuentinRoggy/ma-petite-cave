import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Star, TrendingUp, RotateCcw, Wine, Users } from 'lucide-react'
import { MonthlyChart } from './components/monthly-chart'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

async function getStatsData() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const [overviewRes, topWinesRes, topClientsRes, monthlyRes] = await Promise.all([
      fetch(`${API_URL}/merchant/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/merchant/stats/top-wines`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/merchant/stats/top-clients`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/merchant/stats/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ])

    return {
      overview: overviewRes.ok ? await overviewRes.json() : null,
      topWines: topWinesRes.ok ? await topWinesRes.json() : null,
      topClients: topClientsRes.ok ? await topClientsRes.json() : null,
      monthly: monthlyRes.ok ? await monthlyRes.json() : null,
    }
  } catch {
    return null
  }
}

const colorClasses: Record<string, string> = {
  rouge: 'bg-red-100 text-red-800',
  blanc: 'bg-yellow-100 text-yellow-800',
  rosé: 'bg-pink-100 text-pink-800',
  pétillant: 'bg-blue-100 text-blue-800',
}

type TopWine = {
  id: string
  name: string
  domain: string | null
  vintage: number | null
  color: string | null
  avgRating: number
  ratingsCount: number
}

type TopClient = {
  id: number
  fullName: string | null
  email: string
  avgRating: number
  ratingsCount: number
}

export default async function StatsPage() {
  const data = await getStatsData()

  const overview = data?.overview?.stats || {
    totalBoxesSent: 0,
    avgRating: 0,
    ratingRate: 0,
    totalReorders: 0,
    totalWines: 0,
    totalClients: 0,
  }
  const topWines: TopWine[] = data?.topWines?.wines || []
  const topClients: TopClient[] = data?.topClients?.clients || []
  const monthlyData: Array<{ month: string; count: number }> = data?.monthly?.months || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Box envoyées</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalBoxesSent}</div>
            <p className="text-xs text-muted-foreground">au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {overview.avgRating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.ratingRate}% de vins notés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Re-commandes</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalReorders}</div>
            <p className="text-xs text-muted-foreground">demandes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {overview.totalWines} vins au catalogue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique évolution mensuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Évolution mensuelle
          </CardTitle>
          <CardDescription>Box envoyées sur les 12 derniers mois</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={monthlyData} />
        </CardContent>
      </Card>

      {/* Top vins + Top clients */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 5 vins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5" />
              Top 5 vins les plus aimés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topWines.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Pas encore de notes sur vos vins.
              </p>
            ) : (
              <div className="space-y-4">
                {topWines.map((wine, index) => (
                  <div key={wine.id} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{wine.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {wine.domain && <span className="truncate">{wine.domain}</span>}
                        {wine.vintage && <span>{wine.vintage}</span>}
                        {wine.color && (
                          <Badge className={colorClasses[wine.color] || 'bg-gray-100'} variant="secondary">
                            {wine.color}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{wine.avgRating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {wine.ratingsCount} avis
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clients les plus actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClients.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Pas encore de notes de vos clients.
              </p>
            ) : (
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {client.fullName || 'Client'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {client.email}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{client.avgRating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {client.ratingsCount} notes
                      </p>
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
