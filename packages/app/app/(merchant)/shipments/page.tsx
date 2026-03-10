import { cookies } from 'next/headers'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Send } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

type Box = {
  id: number
  month: string
  status: 'draft' | 'sent'
  sentAt: string | null
  client: {
    id: number
    fullName: string | null
    email: string
  }
  wines: Array<{
    id: number
    wine: {
      name: string
      domain: string | null
    }
  }>
}

async function getBoxes(): Promise<Box[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return []

  try {
    const res = await fetch(`${API_URL}/merchant/boxes`, {
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

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
}

export default async function ShipmentsPage() {
  const boxes = await getBoxes()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Box mensuelles</h1>
          <p className="text-muted-foreground">Préparez et gérez les box de vos clients</p>
        </div>
        <Button asChild>
          <Link href="/shipments/new">
            <Plus className="mr-2 h-4 w-4" />
            Créer une box
          </Link>
        </Button>
      </div>

      {boxes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune box</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Les box apparaîtront ici une fois que vous en aurez créé.
            </p>
            <Button asChild>
              <Link href="/shipments/new">
                <Plus className="mr-2 h-4 w-4" />
                Créer une box
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box) => (
            <Link key={box.id} href={`/shipments/${box.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">
                        {new Date(box.month + '-01').toLocaleDateString('fr-FR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {box.client.fullName || box.client.email}
                      </p>
                    </div>
                    <Badge className={statusColors[box.status]}>
                      {statusLabels[box.status]}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    {box.wines.map((item) => (
                      <p key={item.id} className="text-sm truncate">
                        {item.wine.name}
                      </p>
                    ))}
                  </div>

                  {box.status === 'draft' && (
                    <div className="mt-3 pt-3 border-t flex items-center text-sm text-muted-foreground">
                      <Send className="h-4 w-4 mr-1" />
                      Prête à être envoyée
                    </div>
                  )}

                  {box.sentAt && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Envoyée le{' '}
                      {new Date(box.sentAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
