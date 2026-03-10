import { cookies } from 'next/headers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Users, Mail } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

type Client = {
  id: number
  status: string
  notes: string | null
  createdAt: string
  client: {
    id: number
    email: string
    fullName: string | null
    phone: string | null
  }
  lastBox: {
    month: string
    status: string
  } | null
}

async function getClients(search?: string): Promise<Client[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return []

  try {
    const url = new URL(`${API_URL}/merchant/clients`)
    if (search) url.searchParams.set('search', search)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.clients || []
  } catch {
    return []
  }
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  pending_invite: 'bg-blue-100 text-blue-800',
}

const statusLabels: Record<string, string> = {
  active: 'Actif',
  paused: 'En pause',
  cancelled: 'Annulé',
  pending_invite: 'Invitation envoyée',
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const clients = await getClients(params.search)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Gérez vos abonnés et leurs box mensuelles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/clients/invite">
              <Mail className="mr-2 h-4 w-4" />
              Inviter par email
            </Link>
          </Button>
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Rechercher un client..."
            defaultValue={params.search}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {/* List */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {params.search ? 'Aucun client trouvé' : 'Aucun client'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              {params.search
                ? 'Essayez avec d\'autres termes de recherche.'
                : 'Invitez votre premier client en lui créant un compte.'}
            </p>
            {!params.search && (
              <Button asChild>
                <Link href="/clients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un client
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((subscription) => (
            <Link key={subscription.id} href={`/clients/${subscription.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">
                        {subscription.client.fullName || 'Sans nom'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {subscription.client.email}
                      </p>
                    </div>
                    <Badge className={statusColors[subscription.status] || 'bg-gray-100'}>
                      {statusLabels[subscription.status] || subscription.status}
                    </Badge>
                  </div>

                  {subscription.client.phone && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {subscription.client.phone}
                    </p>
                  )}

                  {subscription.lastBox && (
                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      Dernière box : {subscription.lastBox.month}
                      {subscription.lastBox.status === 'draft' && (
                        <Badge variant="outline" className="ml-2">
                          Brouillon
                        </Badge>
                      )}
                    </div>
                  )}

                  {subscription.notes && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {subscription.notes}
                    </p>
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
