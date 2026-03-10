import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Wine as WineIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

type BoxDetail = {
  id: number
  month: string
  sentAt: string
  merchant: {
    shopName: string | null
  }
  wines: Array<{
    id: number
    merchantNotes: string | null
    wine: {
      id: string
      name: string
      domain: string | null
      vintage: number | null
      color: string | null
      photoUrl: string | null
    }
    clientWine: {
      id: number
      rating: number | null
      status: string
    } | null
  }>
}

async function getBox(id: string): Promise<BoxDetail | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const res = await fetch(`${API_URL}/client/boxes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.box
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

const statusLabels: Record<string, string> = {
  in_cellar: 'En cave',
  opened: 'Ouverte',
  finished: 'Terminée',
}

export default async function ClientBoxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const box = await getBox(id)

  if (!box) {
    notFound()
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/boxes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">
            Box{' '}
            {new Date(box.month + '-01').toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {box.merchant.shopName || 'Votre caviste'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {box.wines.map((item) => (
          <Link
            key={item.id}
            href={item.clientWine ? `/cave/${item.clientWine.id}` : '#'}
          >
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
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <WineIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.wine.name}</h3>
                      {item.wine.domain && (
                        <p className="text-sm text-muted-foreground">{item.wine.domain}</p>
                      )}
                    </div>
                    {item.clientWine?.rating && (
                      <span className="text-yellow-500">
                        {'★'.repeat(item.clientWine.rating)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    {item.wine.vintage && <Badge variant="outline">{item.wine.vintage}</Badge>}
                    {item.wine.color && (
                      <Badge className={colorClasses[item.wine.color] || 'bg-gray-100'}>
                        {item.wine.color}
                      </Badge>
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
                        {statusLabels[item.clientWine.status]}
                      </Badge>
                    </div>
                  )}

                  {item.merchantNotes && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {item.merchantNotes}
                    </p>
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
