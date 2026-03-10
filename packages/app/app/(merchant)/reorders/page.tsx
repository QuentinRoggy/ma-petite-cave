import { cookies } from 'next/headers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RotateCcw, Star, Wine as WineIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

type Reorder = {
  id: number
  requestedAt: string
  rating: number | null
  personalNotes: string | null
  client: {
    id: number
    fullName: string | null
    email: string
  }
  wine: {
    id: string
    name: string
    domain: string | null
    vintage: number | null
    photoUrl: string | null
  }
}

async function getReorders(): Promise<Reorder[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return []

  try {
    const res = await fetch(`${API_URL}/merchant/reorders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.reorders || []
  } catch {
    return []
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `il y a ${diffMins} min`
  } else if (diffHours < 24) {
    return `il y a ${diffHours}h`
  } else if (diffDays < 7) {
    return `il y a ${diffDays}j`
  } else {
    return date.toLocaleDateString('fr-FR')
  }
}

export default async function ReordersPage() {
  const reorders = await getReorders()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <RotateCcw className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Demandes de re-commande</h1>
        {reorders.length > 0 && <Badge variant="destructive">{reorders.length}</Badge>}
      </div>

      {reorders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune demande de re-commande pour le moment.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Quand vos clients cliqueront sur &quot;J&apos;en reveux !&quot;, leurs demandes
              apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reorders.map((reorder) => (
            <Card key={reorder.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Photo du vin */}
                  <div className="w-20 h-28 relative bg-muted rounded overflow-hidden flex-shrink-0">
                    {reorder.wine.photoUrl ? (
                      <Image
                        src={reorder.wine.photoUrl}
                        alt={reorder.wine.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <WineIcon className="h-8 w-8 text-muted-foreground/50" />
                      </div>
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
                        {reorder.client.fullName || reorder.client.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{reorder.client.email}</p>
                      {reorder.personalNotes && (
                        <p className="text-sm mt-2 italic">
                          &quot;{reorder.personalNotes}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <p className="text-xs text-muted-foreground">
                        Demandé {formatTimeAgo(reorder.requestedAt)}
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
