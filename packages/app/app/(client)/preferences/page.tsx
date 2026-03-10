'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

type Preferences = {
  colors?: string[]
  budgetMin?: number
  budgetMax?: number
  regions?: string[]
  aromas?: string[]
  restrictions?: string[]
}

const WINE_COLORS = [
  { value: 'rouge', label: 'Rouge', className: 'bg-red-100 text-red-800 hover:bg-red-200' },
  { value: 'blanc', label: 'Blanc', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  { value: 'rosé', label: 'Rosé', className: 'bg-pink-100 text-pink-800 hover:bg-pink-200' },
  { value: 'pétillant', label: 'Pétillant', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
]

const SUGGESTED_REGIONS = [
  'Bordeaux', 'Bourgogne', 'Champagne', 'Vallée du Rhône', 'Loire',
  'Alsace', 'Languedoc', 'Provence', 'Beaujolais', 'Jura',
]

const SUGGESTED_AROMAS = [
  'Fruité', 'Boisé', 'Épicé', 'Floral', 'Minéral',
  'Agrumes', 'Fruits rouges', 'Vanille', 'Chocolat', 'Miel',
]

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<Preferences>({})
  const [newRegion, setNewRegion] = useState('')
  const [newAroma, setNewAroma] = useState('')
  const [newRestriction, setNewRestriction] = useState('')

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch('/api/proxy/client/preferences')
        if (res.ok) {
          const data = await res.json()
          setPreferences(data.preferences || {})
        }
      } catch {
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchPreferences()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/proxy/client/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setPreferences(data.preferences)
      toast.success('Préférences enregistrées')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const toggleColor = (color: string) => {
    const current = preferences.colors || []
    setPreferences({
      ...preferences,
      colors: current.includes(color)
        ? current.filter((c) => c !== color)
        : [...current, color],
    })
  }

  const addItem = (field: 'regions' | 'aromas' | 'restrictions', value: string) => {
    if (!value.trim()) return
    const current = preferences[field] || []
    if (current.includes(value.trim())) return
    setPreferences({ ...preferences, [field]: [...current, value.trim()] })
  }

  const removeItem = (field: 'regions' | 'aromas' | 'restrictions', value: string) => {
    const current = preferences[field] || []
    setPreferences({ ...preferences, [field]: current.filter((v) => v !== value) })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold">Mes préférences</h1>
        <p className="text-muted-foreground">
          Aidez votre caviste à mieux vous connaître
        </p>
      </div>

      {/* Couleurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Couleurs préférées</CardTitle>
          <CardDescription>Quels types de vin préférez-vous ?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {WINE_COLORS.map((color) => {
              const selected = (preferences.colors || []).includes(color.value)
              return (
                <button
                  key={color.value}
                  onClick={() => toggleColor(color.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selected
                      ? `${color.className} ring-2 ring-offset-2 ring-current`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {color.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget par bouteille</CardTitle>
          <CardDescription>Votre fourchette de prix idéale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label htmlFor="budgetMin">Min (€)</Label>
              <Input
                id="budgetMin"
                type="number"
                min={0}
                value={preferences.budgetMin ?? ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    budgetMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="5"
              />
            </div>
            <span className="pt-6 text-muted-foreground">—</span>
            <div className="flex-1">
              <Label htmlFor="budgetMax">Max (€)</Label>
              <Input
                id="budgetMax"
                type="number"
                min={0}
                value={preferences.budgetMax ?? ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    budgetMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Régions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Régions favorites</CardTitle>
          <CardDescription>
            Sélectionnez ou ajoutez vos régions viticoles préférées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_REGIONS.map((region) => {
              const selected = (preferences.regions || []).includes(region)
              return (
                <button
                  key={region}
                  onClick={() =>
                    selected
                      ? removeItem('regions', region)
                      : addItem('regions', region)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {region}
                </button>
              )
            })}
          </div>
          {/* Custom items */}
          <div className="flex flex-wrap gap-1">
            {(preferences.regions || [])
              .filter((r) => !SUGGESTED_REGIONS.includes(r))
              .map((region) => (
                <Badge key={region} variant="secondary" className="gap-1">
                  {region}
                  <button onClick={() => removeItem('regions', region)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              placeholder="Autre région..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addItem('regions', newRegion)
                  setNewRegion('')
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                addItem('regions', newRegion)
                setNewRegion('')
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Arômes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arômes appréciés</CardTitle>
          <CardDescription>Quels profils aromatiques vous plaisent ?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_AROMAS.map((aroma) => {
              const selected = (preferences.aromas || []).includes(aroma)
              return (
                <button
                  key={aroma}
                  onClick={() =>
                    selected
                      ? removeItem('aromas', aroma)
                      : addItem('aromas', aroma)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {aroma}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-1">
            {(preferences.aromas || [])
              .filter((a) => !SUGGESTED_AROMAS.includes(a))
              .map((aroma) => (
                <Badge key={aroma} variant="secondary" className="gap-1">
                  {aroma}
                  <button onClick={() => removeItem('aromas', aroma)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newAroma}
              onChange={(e) => setNewAroma(e.target.value)}
              placeholder="Autre arôme..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addItem('aromas', newAroma)
                  setNewAroma('')
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                addItem('aromas', newAroma)
                setNewAroma('')
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restrictions</CardTitle>
          <CardDescription>
            Y a-t-il des choses que vous souhaitez éviter ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {(preferences.restrictions || []).map((restriction) => (
              <Badge key={restriction} variant="destructive" className="gap-1">
                {restriction}
                <button onClick={() => removeItem('restrictions', restriction)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRestriction}
              onChange={(e) => setNewRestriction(e.target.value)}
              placeholder="Ex: Sulfites, Bio uniquement..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addItem('restrictions', newRestriction)
                  setNewRestriction('')
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                addItem('restrictions', newRestriction)
                setNewRestriction('')
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save button - fixed */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
        <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer mes préférences
        </Button>
      </div>
    </div>
  )
}
