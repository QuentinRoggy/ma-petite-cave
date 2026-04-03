'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, X, Plus, Camera } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewPersonalWinePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aromas, setAromas] = useState<string[]>([])
  const [foodPairings, setFoodPairings] = useState<string[]>([])
  const [newAroma, setNewAroma] = useState('')
  const [newPairing, setNewPairing] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const addAroma = () => {
    if (newAroma.trim() && !aromas.includes(newAroma.trim())) {
      setAromas([...aromas, newAroma.trim()])
      setNewAroma('')
    }
  }

  const addPairing = () => {
    if (newPairing.trim() && !foodPairings.includes(newPairing.trim())) {
      setFoodPairings([...foodPairings, newPairing.trim()])
      setNewPairing('')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      let photoUrl: string | null = null
      if (photoFile) {
        const uploadData = new FormData()
        uploadData.append('photo', photoFile)
        const uploadRes = await fetch('/api/proxy/uploads/wine-photo', {
          method: 'POST',
          body: uploadData,
        })
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || "Erreur lors de l'upload de la photo")
        }
        const uploadJson = await uploadRes.json()
        photoUrl = uploadJson.photoUrl
      }

      const data: Record<string, unknown> = {
        name: formData.get('name'),
        domain: formData.get('domain') || undefined,
        vintage: formData.get('vintage') ? Number(formData.get('vintage')) : undefined,
        color: formData.get('color') || undefined,
        region: formData.get('region') || undefined,
        grapes: formData.get('grapes') || undefined,
        alcoholDegree: formData.get('alcoholDegree')
          ? Number(formData.get('alcoholDegree'))
          : undefined,
        guardMin: formData.get('guardMin') ? Number(formData.get('guardMin')) : undefined,
        guardMax: formData.get('guardMax') ? Number(formData.get('guardMax')) : undefined,
        aromas: aromas.length > 0 ? aromas : undefined,
        foodPairings: foodPairings.length > 0 ? foodPairings : undefined,
        notes: formData.get('notes') || undefined,
      }

      if (photoUrl) data.photoUrl = photoUrl

      const res = await fetch('/api/proxy/client/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Erreur lors de la création')
      }

      toast.success('Vin ajouté à votre cave')
      router.push('/cave')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cave">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Ajouter un vin</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      removePhoto()
                    }}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary transition-colors">
                  <Camera className="h-8 w-8" />
                  <span className="text-sm">Ajouter une photo</span>
                  <span className="text-xs">JPG, PNG, WEBP, HEIC · 10 Mo max</span>
                </div>
              )}
            </label>
          </CardContent>
        </Card>

        {/* Infos de base */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du vin *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domaine</Label>
              <Input id="domain" name="domain" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vintage">Millésime</Label>
                <Input id="vintage" name="vintage" type="number" min={1900} max={2100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Select name="color">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rouge">Rouge</SelectItem>
                    <SelectItem value="blanc">Blanc</SelectItem>
                    <SelectItem value="rosé">Rosé</SelectItem>
                    <SelectItem value="pétillant">Pétillant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Région</Label>
              <Input id="region" name="region" placeholder="Bordeaux, Bourgogne..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grapes">Cépages</Label>
                <Input id="grapes" name="grapes" placeholder="Merlot, Cabernet..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alcoholDegree">Alcool (%)</Label>
                <Input
                  id="alcoholDegree"
                  name="alcoholDegree"
                  type="number"
                  step="0.1"
                  min={0}
                  max={20}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Garde */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Garde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardMin">Minimum (années)</Label>
                <Input id="guardMin" name="guardMin" type="number" min={0} max={50} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardMax">Maximum (années)</Label>
                <Input id="guardMax" name="guardMax" type="number" min={0} max={50} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arômes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arômes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newAroma}
                onChange={(e) => setNewAroma(e.target.value)}
                placeholder="Ajouter un arôme"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAroma()
                  }
                }}
              />
              <Button type="button" onClick={addAroma} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {aromas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aromas.map((aroma) => (
                  <Badge key={aroma} variant="secondary">
                    {aroma}
                    <button
                      type="button"
                      onClick={() => setAromas(aromas.filter((a) => a !== aroma))}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accords mets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accords mets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newPairing}
                onChange={(e) => setNewPairing(e.target.value)}
                placeholder="Ajouter un accord"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addPairing()
                  }
                }}
              />
              <Button type="button" onClick={addPairing} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {foodPairings.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {foodPairings.map((pairing) => (
                  <Badge key={pairing} variant="secondary">
                    {pairing}
                    <button
                      type="button"
                      onClick={() => setFoodPairings(foodPairings.filter((p) => p !== pairing))}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              placeholder="Où acheté, occasion, impressions..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href="/cave">Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter à ma cave
          </Button>
        </div>
      </form>
    </div>
  )
}
