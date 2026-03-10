import { cookies } from 'next/headers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wine as WineIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

type ClientWine = {
  id: number
  status: 'in_cellar' | 'opened' | 'finished'
  rating: number | null
  wine: {
    id: string
    name: string
    domain: string | null
    vintage: number | null
    color: string | null
    photoUrl: string | null
  }
  boxMonth: string
}

async function getWines(): Promise<ClientWine[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return []

  try {
    const res = await fetch(`${API_URL}/client/wines`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.wines || []
  } catch {
    return []
  }
}

const colorClasses: Record<string, string> = {
  rouge: 'bg-red-100 text-red-800',
  blanc: 'bg-yellow-100 text-yellow-800',
  rosé: 'bg-pink-100 text-pink-800',
  pétillant: 'bg-blue-100 text-blue-800',
}

const statusLabels: Record<string, string> = {
  in_cellar: 'En cave',
  opened: 'Ouverte',
  finished: 'Terminée',
}

const statusColors: Record<string, string> = {
  in_cellar: 'bg-blue-100 text-blue-800',
  opened: 'bg-orange-100 text-orange-800',
  finished: 'bg-gray-100 text-gray-800',
}

export default async function CavePage() {
  const wines = await getWines()

  // Group by status
  const inCellar = wines.filter((w) => w.status === 'in_cellar')
  const opened = wines.filter((w) => w.status === 'opened')
  const finished = wines.filter((w) => w.status === 'finished')

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Ma cave</h1>

      {wines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WineIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cave vide</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Les vins de vos box apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* En cave */}
          {inCellar.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge className={statusColors.in_cellar}>{statusLabels.in_cellar}</Badge>
                <span className="text-muted-foreground text-sm font-normal">
                  ({inCellar.length})
                </span>
              </h2>
              <div className="grid gap-3">
                {inCellar.map((wine) => (
                  <WineCard key={wine.id} wine={wine} />
                ))}
              </div>
            </section>
          )}

          {/* Ouvertes */}
          {opened.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge className={statusColors.opened}>{statusLabels.opened}</Badge>
                <span className="text-muted-foreground text-sm font-normal">
                  ({opened.length})
                </span>
              </h2>
              <div className="grid gap-3">
                {opened.map((wine) => (
                  <WineCard key={wine.id} wine={wine} />
                ))}
              </div>
            </section>
          )}

          {/* Terminées */}
          {finished.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge className={statusColors.finished}>{statusLabels.finished}</Badge>
                <span className="text-muted-foreground text-sm font-normal">
                  ({finished.length})
                </span>
              </h2>
              <div className="grid gap-3">
                {finished.map((wine) => (
                  <WineCard key={wine.id} wine={wine} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function WineCard({ wine }: { wine: ClientWine }) {
  return (
    <Link href={`/cave/${wine.id}`}>
      <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
        <div className="flex">
          <div className="w-16 h-20 relative bg-muted flex-shrink-0">
            {wine.wine.photoUrl ? (
              <Image
                src={wine.wine.photoUrl}
                alt={wine.wine.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <WineIcon className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <CardContent className="p-3 flex-1">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="font-medium text-sm truncate">{wine.wine.name}</h3>
                {wine.wine.domain && (
                  <p className="text-xs text-muted-foreground truncate">{wine.wine.domain}</p>
                )}
              </div>
              {wine.rating && (
                <span className="text-yellow-500 text-sm flex-shrink-0 ml-2">
                  {'★'.repeat(wine.rating)}
                </span>
              )}
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {wine.wine.vintage && (
                <Badge variant="outline" className="text-xs">
                  {wine.wine.vintage}
                </Badge>
              )}
              {wine.wine.color && (
                <Badge className={`text-xs ${colorClasses[wine.wine.color] || 'bg-gray-100'}`}>
                  {wine.wine.color}
                </Badge>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  )
}
