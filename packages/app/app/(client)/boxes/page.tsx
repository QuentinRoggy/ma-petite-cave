import { cookies } from 'next/headers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

type Box = {
  id: number
  month: string
  sentAt: string
  merchant: {
    shopName: string | null
  }
  wines: Array<{
    id: number
    wine: {
      id: string
      name: string
      photoUrl: string | null
    }
    clientWine: {
      id: number
      rating: number | null
      status: string
    } | null
  }>
  totalWines: number
  ratedWines: number
}

async function getBoxes(): Promise<Box[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return []

  try {
    const res = await fetch(`${API_URL}/client/boxes`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.boxes || []
  } catch {
    return []
  }
}

export default async function ClientBoxesPage() {
  const boxes = await getBoxes()

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Mes box</h1>

      {boxes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune box</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Vos box mensuelles apparaîtront ici une fois envoyées par votre caviste.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {boxes.map((box) => {
            const allRated = box.ratedWines === box.totalWines && box.totalWines > 0

            return (
              <Link key={box.id} href={`/boxes/${box.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden">
                  {/* Photos des vins */}
                  <div className="flex h-32">
                    {box.wines.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex-1 relative bg-muted">
                        {item.wine.photoUrl ? (
                          <Image
                            src={item.wine.photoUrl}
                            alt={item.wine.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-8 w-8 text-muted-foreground/50" />
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
                          {box.merchant.shopName || 'Votre caviste'}
                        </p>
                      </div>
                      <Badge variant={allRated ? 'default' : 'secondary'}>
                        {box.ratedWines}/{box.totalWines} notés
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1">
                      {box.wines.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <span className="truncate">{item.wine.name}</span>
                          {item.clientWine?.rating && (
                            <span className="text-yellow-500 flex-shrink-0">
                              {'★'.repeat(item.clientWine.rating)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
