'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Wine, WineType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhotoUploader } from './photo-uploader'
import { RatingStars } from './rating-stars'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface WineFormProps {
  wine?: Wine
  mode: 'create' | 'edit'
  wineType?: WineType
}

const colors = [
  { value: 'rouge', label: 'Rouge' },
  { value: 'blanc', label: 'Blanc' },
  { value: 'rosé', label: 'Rosé' },
  { value: 'pétillant', label: 'Pétillant' },
]

export function WineForm({ wine, mode, wineType = 'cave' }: WineFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const effectiveType = wine?.type ?? wineType
  const isWishlist = effectiveType === 'wishlist'

  const [photoUrl, setPhotoUrl] = useState<string | null>(wine?.photoUrl ?? null)
  const [name, setName] = useState(wine?.name ?? '')
  const [domain, setDomain] = useState(wine?.domain ?? '')
  const [vintage, setVintage] = useState(wine?.vintage?.toString() ?? '')
  const [color, setColor] = useState(wine?.color ?? '')
  const [merchantNotes, setMerchantNotes] = useState(wine?.merchantNotes ?? '')
  const [personalNotes, setPersonalNotes] = useState(wine?.personalNotes ?? '')
  const [rating, setRating] = useState<number>(wine?.rating ?? 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!photoUrl) {
      setError('Une photo est requise')
      return
    }
    setError('')
    setLoading(true)

    const payload: Record<string, unknown> = {
      name,
      photoUrl,
    }

    if (mode === 'create') {
      payload.type = effectiveType
    }

    if (domain) payload.domain = domain
    if (vintage) payload.vintage = parseInt(vintage, 10)
    if (color) payload.color = color
    if (merchantNotes) payload.merchantNotes = merchantNotes
    if (personalNotes) payload.personalNotes = personalNotes
    if (!isWishlist && rating > 0) payload.rating = rating

    // For update, include nullable fields explicitly
    if (mode === 'edit') {
      payload.domain = domain || null
      payload.vintage = vintage ? parseInt(vintage, 10) : null
      payload.color = color || null
      payload.merchantNotes = merchantNotes || null
      payload.personalNotes = personalNotes || null
      if (!isWishlist) {
        payload.rating = rating > 0 ? rating : null
      }
    }

    try {
      const url =
        mode === 'create' ? '/api/proxy/wines' : `/api/proxy/wines/${wine!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.errors?.[0]?.message || data.message || 'Erreur lors de la sauvegarde')
        return
      }

      const basePath = isWishlist ? '/wishlist' : '/wines'

      if (mode === 'create') {
        toast.success(isWishlist ? 'Ajouté à la wishlist' : 'Vin ajouté avec succès')
        router.push(`${basePath}/${data.wine.id}`)
      } else {
        toast.success('Modifications enregistrées')
        router.push(`${basePath}/${wine!.id}`)
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <p className="text-destructive text-sm rounded-md bg-destructive/10 px-3 py-2">{error}</p>
      )}

      <PhotoUploader value={photoUrl} onChange={setPhotoUrl} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nom du vin *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Châteauneuf-du-Pape"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="domain">Domaine / Producteur</Label>
          <Input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Ex: Domaine de la Janasse"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vintage">Millésime</Label>
            <Input
              id="vintage"
              type="number"
              min={1900}
              max={2100}
              value={vintage}
              onChange={(e) => setVintage(e.target.value)}
              placeholder="2022"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Couleur</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {colors.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="merchantNotes">Notes du caviste</Label>
          <Textarea
            id="merchantNotes"
            value={merchantNotes}
            onChange={(e) => setMerchantNotes(e.target.value)}
            placeholder="Ce que le caviste en dit..."
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="personalNotes">Mes notes</Label>
          <Textarea
            id="personalNotes"
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            placeholder={isWishlist ? 'Pourquoi je veux ce vin...' : 'Mon ressenti...'}
            rows={3}
          />
        </div>

        {!isWishlist && (
          <div className="flex flex-col gap-2">
            <Label>Ma note</Label>
            <RatingStars value={rating} onChange={setRating} size="md" />
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {mode === 'create'
          ? isWishlist
            ? 'Ajouter à la wishlist'
            : 'Ajouter le vin'
          : 'Enregistrer'}
      </Button>
    </form>
  )
}
