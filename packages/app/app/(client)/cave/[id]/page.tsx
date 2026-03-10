'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, RotateCcw, Save, Star, Wine, GlassWater, CheckCircle, Share2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

type ClientWineDetail = {
  id: number
  status: 'in_cellar' | 'opened' | 'finished'
  rating: number | null
  personalNotes: string | null
  openedAt: string | null
  finishedAt: string | null
  wantsReorder: boolean
  merchantNotes: string | null
  wine: {
    id: string
    name: string
    domain: string | null
    vintage: number | null
    color: string | null
    region: string | null
    grapes: string | null
    alcoholDegree: number | null
    guardMin: number | null
    guardMax: number | null
    aromas: string[] | null
    foodPairings: string[] | null
    photoUrl: string | null
  }
  box: {
    month: string
  }
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

export default function WineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<ClientWineDetail | null>(null)

  const [status, setStatus] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function fetchWine() {
      try {
        const res = await fetch(`/api/proxy/client/wines/${params.id}`)
        if (!res.ok) throw new Error('Vin non trouvé')
        const json = await res.json()
        setData(json.clientWine)
        setStatus(json.clientWine.status)
        setRating(json.clientWine.rating)
        setNotes(json.clientWine.personalNotes || '')
      } catch {
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchWine()
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/proxy/client/wines/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rating,
          personalNotes: notes || null,
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la sauvegarde')

      toast.success('Modifications enregistrées')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    if (!data) return
    const shareUrl = `${window.location.origin}/wine/${data.wine.id}`
    const shareData = {
      title: data.wine.name,
      text: `Découvrez ${data.wine.name}${data.wine.domain ? ` de ${data.wine.domain}` : ''}`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // L'utilisateur a annulé le partage
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Lien copié dans le presse-papier')
      } catch {
        toast.error('Impossible de copier le lien')
      }
    }
  }

  const handleReorder = async () => {
    try {
      const res = await fetch(`/api/proxy/client/wines/${params.id}/reorder`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      toast.success('Demande envoyée à votre caviste')
      // Refresh data
      const refreshRes = await fetch(`/api/proxy/client/wines/${params.id}`)
      const json = await refreshRes.json()
      setData(json.clientWine)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cave">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Vin non trouvé</h1>
        </div>
      </div>
    )
  }

  const wine = data.wine

  return (
    <div className="pb-20">
      {/* Header avec photo */}
      <div className="relative">
        <div className="h-64 bg-muted relative">
          {wine.photoUrl && (
            <Image src={wine.photoUrl} alt={wine.name} fill className="object-cover" />
          )}
        </div>
        <Link href="/cave" className="absolute top-4 left-4">
          <Button variant="secondary" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4"
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Titre */}
        <div>
          <h1 className="text-2xl font-bold">{wine.name}</h1>
          {wine.domain && <p className="text-muted-foreground">{wine.domain}</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            {wine.vintage && <Badge variant="outline">{wine.vintage}</Badge>}
            {wine.color && (
              <Badge className={colorClasses[wine.color] || 'bg-gray-100'}>{wine.color}</Badge>
            )}
            {wine.region && <Badge variant="outline">{wine.region}</Badge>}
          </div>
        </div>

        <Separator />

        {/* Statut et notation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Statut</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_cellar">
                  <div className="flex items-center gap-2">
                    <Wine className="h-4 w-4" />
                    En cave
                  </div>
                </SelectItem>
                <SelectItem value="opened">
                  <div className="flex items-center gap-2">
                    <GlassWater className="h-4 w-4" />
                    Ouverte
                  </div>
                </SelectItem>
                <SelectItem value="finished">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Terminée
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Ma note</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = (hoveredRating ?? rating ?? 0) >= value

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(null)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        filled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes du caviste */}
        {data.merchantNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Notes de {data.merchant.shopName || 'votre caviste'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{data.merchantNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Infos du vin */}
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

        {/* Mes notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mes notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mes impressions, avec quoi je l'ai dégusté..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReorder}
            disabled={data.wantsReorder}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {data.wantsReorder ? 'Demande envoyée' : "J'en reveux !"}
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  )
}
