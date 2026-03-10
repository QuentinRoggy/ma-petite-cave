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
import { ArrowLeft, Loader2, X, Plus } from 'lucide-react'
import Link from 'next/link'

export default function NewWinePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aromas, setAromas] = useState<string[]>([])
  const [foodPairings, setFoodPairings] = useState<string[]>([])
  const [newAroma, setNewAroma] = useState('')
  const [newPairing, setNewPairing] = useState('')

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
    const data = {
      name: formData.get('name'),
      domain: formData.get('domain') || null,
      vintage: formData.get('vintage') ? Number(formData.get('vintage')) : null,
      color: formData.get('color') || null,
      region: formData.get('region') || null,
      grapes: formData.get('grapes') || null,
      alcoholDegree: formData.get('alcoholDegree')
        ? Number(formData.get('alcoholDegree'))
        : null,
      guardMin: formData.get('guardMin') ? Number(formData.get('guardMin')) : null,
      guardMax: formData.get('guardMax') ? Number(formData.get('guardMax')) : null,
      aromas: aromas.length > 0 ? aromas : null,
      foodPairings: foodPairings.length > 0 ? foodPairings : null,
      notes: formData.get('notes') || null,
    }

    try {
      const res = await fetch('/api/proxy/merchant/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Erreur lors de la création')
      }

      router.push('/wines')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/wines">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Ajouter un vin</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Infos de base */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du vin *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domaine</Label>
                <Input id="domain" name="domain" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="vintage">Millésime</Label>
                <Input
                  id="vintage"
                  name="vintage"
                  type="number"
                  min={1900}
                  max={2100}
                />
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
              <div className="space-y-2">
                <Label htmlFor="region">Région</Label>
                <Input id="region" name="region" placeholder="Bordeaux..." />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grapes">Cépages</Label>
                <Input id="grapes" name="grapes" placeholder="Merlot, Cabernet..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alcoholDegree">Degré d'alcool (%)</Label>
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
            <CardTitle>Garde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guardMin">Garde minimum (années)</Label>
                <Input
                  id="guardMin"
                  name="guardMin"
                  type="number"
                  min={0}
                  max={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardMax">Garde maximum (années)</Label>
                <Input
                  id="guardMax"
                  name="guardMax"
                  type="number"
                  min={0}
                  max={50}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arômes */}
        <Card>
          <CardHeader>
            <CardTitle>Arômes</CardTitle>
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
              <Button type="button" onClick={addAroma} variant="outline">
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
            <CardTitle>Accords mets</CardTitle>
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
              <Button type="button" onClick={addPairing} variant="outline">
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
                      onClick={() =>
                        setFoodPairings(foodPairings.filter((p) => p !== pairing))
                      }
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
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              placeholder="Description, conseils de dégustation..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href="/wines">Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter au catalogue
          </Button>
        </div>
      </form>
    </div>
  )
}
