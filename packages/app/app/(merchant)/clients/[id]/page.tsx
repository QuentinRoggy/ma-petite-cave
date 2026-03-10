import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Mail, Phone, Heart } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

async function getClient(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const res = await fetch(`${API_URL}/merchant/clients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.subscription
  } catch {
    return null
  }
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  active: 'Actif',
  paused: 'En pause',
  cancelled: 'Annulé',
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const subscription = await getClient(id)

  if (!subscription) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {subscription.client.fullName || 'Client'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[subscription.status]}>
                {statusLabels[subscription.status] || subscription.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/shipments/new?client=${subscription.id}`}>
            <Package className="mr-2 h-4 w-4" />
            Créer une box
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Infos client */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{subscription.client.email}</span>
            </div>
            {subscription.client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{subscription.client.phone}</span>
              </div>
            )}
            {subscription.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{subscription.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{subscription.boxes?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Box envoyées</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Date(subscription.createdAt).toLocaleDateString('fr-FR', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">Client depuis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Préférences client */}
      {subscription.client.preferences && Object.keys(subscription.client.preferences).some(
        (key) => {
          const val = subscription.client.preferences[key]
          return Array.isArray(val) ? val.length > 0 : val !== undefined && val !== null
        }
      ) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Préférences déclarées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription.client.preferences.colors?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Couleurs</p>
                <div className="flex flex-wrap gap-1">
                  {subscription.client.preferences.colors.map((color: string) => (
                    <Badge key={color} variant="secondary" className="capitalize">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {(subscription.client.preferences.budgetMin || subscription.client.preferences.budgetMax) && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Budget</p>
                <p className="text-sm">
                  {subscription.client.preferences.budgetMin && subscription.client.preferences.budgetMax
                    ? `${subscription.client.preferences.budgetMin}€ - ${subscription.client.preferences.budgetMax}€`
                    : subscription.client.preferences.budgetMin
                      ? `À partir de ${subscription.client.preferences.budgetMin}€`
                      : `Jusqu'à ${subscription.client.preferences.budgetMax}€`}
                </p>
              </div>
            )}
            {subscription.client.preferences.regions?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Régions</p>
                <div className="flex flex-wrap gap-1">
                  {subscription.client.preferences.regions.map((region: string) => (
                    <Badge key={region} variant="outline">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {subscription.client.preferences.aromas?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Arômes</p>
                <div className="flex flex-wrap gap-1">
                  {subscription.client.preferences.aromas.map((aroma: string) => (
                    <Badge key={aroma} variant="secondary">
                      {aroma}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {subscription.client.preferences.restrictions?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Restrictions</p>
                <div className="flex flex-wrap gap-1">
                  {subscription.client.preferences.restrictions.map((r: string) => (
                    <Badge key={r} variant="destructive">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historique des box */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des box</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription.boxes?.length > 0 ? (
            <div className="space-y-4">
              {subscription.boxes.map((box: any) => (
                <div
                  key={box.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{box.month}</p>
                    <p className="text-sm text-muted-foreground">
                      {box.wines?.length || 0} vin(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={box.status === 'sent' ? 'default' : 'outline'}>
                      {box.status === 'sent' ? 'Envoyée' : 'Brouillon'}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/shipments/${box.id}`}>Voir</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune box pour ce client</p>
              <Button asChild className="mt-4">
                <Link href={`/shipments/new?client=${subscription.id}`}>
                  Créer la première box
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
