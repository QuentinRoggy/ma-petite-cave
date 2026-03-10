'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Loader2, Wine as WineIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Wine } from '@/lib/types'

const colorLabels: Record<string, string> = {
  rouge: 'Rouge',
  blanc: 'Blanc',
  rosé: 'Rosé',
  pétillant: 'Pétillant',
}

const colorClasses: Record<string, string> = {
  rouge: 'bg-red-100 text-red-800',
  blanc: 'bg-yellow-100 text-yellow-800',
  rosé: 'bg-pink-100 text-pink-800',
  pétillant: 'bg-blue-100 text-blue-800',
}

export default function WineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [wine, setWine] = useState<Wine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchWine() {
      try {
        const res = await fetch(`/api/proxy/merchant/wines/${params.id}`)
        if (!res.ok) {
          throw new Error('Vin non trouvé')
        }
        const data = await res.json()
        setWine(data.wine)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      } finally {
        setLoading(false)
      }
    }
    fetchWine()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce vin ?')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/proxy/merchant/wines/${params.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression')
      }
      router.push('/wines')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !wine) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/wines">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Vin non trouvé</h1>
        </div>
        <p className="text-muted-foreground">{error || "Ce vin n'existe pas."}</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/wines">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{wine.name}</h1>
            {wine.domain && (
              <p className="text-muted-foreground">{wine.domain}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/wines/${wine.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        {/* Photo */}
        <div className="aspect-[3/4] relative bg-muted rounded-lg overflow-hidden">
          {wine.photoUrl ? (
            <Image
              src={wine.photoUrl}
              alt={wine.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <WineIcon className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Infos principales */}
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {wine.vintage && (
                <div>
                  <p className="text-sm text-muted-foreground">Millésime</p>
                  <p className="font-medium">{wine.vintage}</p>
                </div>
              )}
              {wine.color && (
                <div>
                  <p className="text-sm text-muted-foreground">Couleur</p>
                  <Badge className={colorClasses[wine.color]}>
                    {colorLabels[wine.color]}
                  </Badge>
                </div>
              )}
              {wine.region && (
                <div>
                  <p className="text-sm text-muted-foreground">Région</p>
                  <p className="font-medium">{wine.region}</p>
                </div>
              )}
              {wine.grapes && (
                <div>
                  <p className="text-sm text-muted-foreground">Cépages</p>
                  <p className="font-medium">{wine.grapes}</p>
                </div>
              )}
              {wine.alcoholDegree && (
                <div>
                  <p className="text-sm text-muted-foreground">Degré d'alcool</p>
                  <p className="font-medium">{wine.alcoholDegree}%</p>
                </div>
              )}
              {(wine.guardMin || wine.guardMax) && (
                <div>
                  <p className="text-sm text-muted-foreground">Garde</p>
                  <p className="font-medium">
                    {wine.guardMin && wine.guardMax
                      ? `${wine.guardMin} à ${wine.guardMax} ans`
                      : wine.guardMin
                        ? `${wine.guardMin}+ ans`
                        : `Jusqu'à ${wine.guardMax} ans`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arômes */}
      {wine.aromas && wine.aromas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arômes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {wine.aromas.map((aroma) => (
                <Badge key={aroma} variant="secondary">
                  {aroma}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accords mets */}
      {wine.foodPairings && wine.foodPairings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Accords mets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {wine.foodPairings.map((pairing) => (
                <Badge key={pairing} variant="outline">
                  {pairing}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {wine.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{wine.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
