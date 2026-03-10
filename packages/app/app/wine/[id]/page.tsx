import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Wine, Store } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const API_URL = process.env.API_URL || 'http://localhost:3333'

type PublicWine = {
  id: string
  name: string
  domain: string | null
  vintage: number | null
  color: string | null
  region: string | null
  grapes: string | null
  alcoholDegree: number | null
  aromas: string[] | null
  foodPairings: string[] | null
  guardMin: number | null
  guardMax: number | null
  photoUrl: string | null
  notes: string | null
  merchant: {
    shopName: string | null
  }
}

const colorClasses: Record<string, string> = {
  rouge: 'bg-red-100 text-red-800',
  blanc: 'bg-yellow-100 text-yellow-800',
  rosé: 'bg-pink-100 text-pink-800',
  pétillant: 'bg-blue-100 text-blue-800',
}

async function getWine(id: string): Promise<PublicWine | null> {
  try {
    const res = await fetch(`${API_URL}/public/wines/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.wine
  } catch {
    return null
  }
}

export default async function PublicWinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const wine = await getWine(id)

  if (!wine) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Wine className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Vin non trouvé</h1>
        <p className="text-muted-foreground mt-2">
          Ce vin n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Link href="/" className="mt-4 text-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-center px-4 border-b bg-background/95 backdrop-blur">
        <span className="font-semibold">Cuvee</span>
      </header>

      {/* Photo */}
      <div className="relative h-72 bg-muted">
        {wine.photoUrl ? (
          <Image
            src={wine.photoUrl}
            alt={wine.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Wine className="h-20 w-20 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Titre */}
        <div>
          <h1 className="text-2xl font-bold">{wine.name}</h1>
          {wine.domain && (
            <p className="text-muted-foreground text-lg">{wine.domain}</p>
          )}
          <div className="flex gap-2 mt-2 flex-wrap">
            {wine.vintage && <Badge variant="outline">{wine.vintage}</Badge>}
            {wine.color && (
              <Badge className={colorClasses[wine.color] || 'bg-gray-100'}>
                {wine.color}
              </Badge>
            )}
            {wine.region && <Badge variant="outline">{wine.region}</Badge>}
          </div>
        </div>

        <Separator />

        {/* Notes du caviste */}
        {wine.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Notes de {wine.merchant.shopName || 'votre caviste'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{wine.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Détails */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wine.grapes && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cépages</span>
                <span>{wine.grapes}</span>
              </div>
            )}
            {wine.alcoholDegree && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Alcool</span>
                <span>{wine.alcoholDegree}%</span>
              </div>
            )}
            {(wine.guardMin || wine.guardMax) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Garde</span>
                <span>
                  {wine.guardMin && wine.guardMax
                    ? `${wine.guardMin}-${wine.guardMax} ans`
                    : wine.guardMin
                      ? `Min. ${wine.guardMin} ans`
                      : `Max. ${wine.guardMax} ans`}
                </span>
              </div>
            )}
            {wine.aromas && wine.aromas.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Arômes</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {wine.aromas.map((aroma: string) => (
                    <Badge key={aroma} variant="secondary">
                      {aroma}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {wine.foodPairings && wine.foodPairings.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Accords mets</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {wine.foodPairings.map((pairing: string) => (
                    <Badge key={pairing} variant="outline">
                      {pairing}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Merchant info */}
        {wine.merchant.shopName && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Store className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Sélectionné par</p>
                <p className="text-sm text-muted-foreground">
                  {wine.merchant.shopName}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Partagé via Cuvee
          </p>
          <Link href="/register" className="text-primary hover:underline text-sm">
            Découvrir Cuvee
          </Link>
        </div>
      </div>
    </div>
  )
}
