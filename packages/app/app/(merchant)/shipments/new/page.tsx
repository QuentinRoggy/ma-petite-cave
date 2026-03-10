'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Send, Save, Search, Check, X, Wine as WineIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

type Subscription = {
  id: number
  status: string
  client: {
    id: number
    fullName: string | null
    email: string
  }
}

type Wine = {
  id: string
  name: string
  domain: string | null
  vintage: number | null
  color: string | null
  photoUrl: string | null
}

export default function NewShipmentPage() {
  return (
    <Suspense fallback={<NewShipmentPageSkeleton />}>
      <NewShipmentForm />
    </Suspense>
  )
}

function NewShipmentPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/shipments">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Créer une box</h1>
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}

function NewShipmentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClient = searchParams.get('client')

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Subscription[]>([])
  const [wines, setWines] = useState<Wine[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedClient, setSelectedClient] = useState(preselectedClient || '')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedWines, setSelectedWines] = useState<string[]>([])
  const [wineNotes, setWineNotes] = useState<Record<string, string>>({})

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      const res = await fetch('/api/proxy/merchant/clients')
      const data = await res.json()
      setClients(data.clients || [])
    }
    fetchClients()
  }, [])

  // Fetch wines
  useEffect(() => {
    async function fetchWines() {
      const url = searchQuery
        ? `/api/proxy/merchant/wines?query=${encodeURIComponent(searchQuery)}`
        : '/api/proxy/merchant/wines'
      const res = await fetch(url)
      const data = await res.json()
      setWines(data.wines || [])
    }

    const timeout = setTimeout(fetchWines, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const toggleWine = (wineId: string) => {
    if (selectedWines.includes(wineId)) {
      setSelectedWines(selectedWines.filter((id) => id !== wineId))
      const newNotes = { ...wineNotes }
      delete newNotes[wineId]
      setWineNotes(newNotes)
    } else if (selectedWines.length < 2) {
      setSelectedWines([...selectedWines, wineId])
    }
  }

  const handleSave = async (send: boolean = false) => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client')
      return
    }
    if (selectedWines.length === 0) {
      toast.error('Veuillez sélectionner au moins un vin')
      return
    }

    setLoading(true)

    try {
      const payload = {
        subscriptionId: selectedClient,
        month,
        wines: selectedWines.map((id, index) => ({
          wineId: id,
          merchantNotes: wineNotes[id] || null,
          position: index + 1,
        })),
      }

      const res = await fetch('/api/proxy/merchant/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Erreur lors de la création')
      }

      const data = await res.json()

      if (send) {
        const sendRes = await fetch(`/api/proxy/merchant/boxes/${data.box.id}/send`, {
          method: 'POST',
        })

        if (!sendRes.ok) {
          const error = await sendRes.json()
          throw new Error(error.message || "Erreur lors de l'envoi")
        }

        toast.success('Box envoyée au client !')
      } else {
        toast.success('Box enregistrée comme brouillon')
      }

      router.push('/shipments')
      router.refresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Generate month options
  const monthOptions = []
  const now = new Date()
  for (let i = -3; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    monthOptions.push(date.toISOString().slice(0, 7))
  }

  const selectedWineDetails = wines.filter((w) => selectedWines.includes(w.id))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/shipments">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Créer une box</h1>
      </div>

      {/* Client et mois */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((sub) => (
                    <SelectItem key={sub.id} value={String(sub.id)}>
                      {sub.client.fullName || sub.client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mois *</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {new Date(m + '-01').toLocaleDateString('fr-FR', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sélection des vins */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner les vins ({selectedWines.length}/2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans le catalogue..."
              className="pl-10"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 max-h-[400px] overflow-y-auto">
            {wines.map((wine) => {
              const isSelected = selectedWines.includes(wine.id)
              const disabled = !isSelected && selectedWines.length >= 2

              return (
                <div
                  key={wine.id}
                  onClick={() => !disabled && toggleWine(wine.id)}
                  className={`flex gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-primary bg-primary/5'
                      : disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="w-12 h-16 relative bg-muted rounded overflow-hidden flex-shrink-0">
                    {wine.photoUrl ? (
                      <Image src={wine.photoUrl} alt={wine.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <WineIcon className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{wine.name}</h4>
                    {wine.domain && (
                      <p className="text-xs text-muted-foreground truncate">{wine.domain}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {wine.vintage && <span className="text-xs">{wine.vintage}</span>}
                      {wine.color && (
                        <Badge variant="outline" className="text-xs">
                          {wine.color}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notes personnalisées */}
      {selectedWineDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notes personnalisées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedWineDetails.map((wine, index) => (
              <div key={wine.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 relative bg-muted rounded overflow-hidden flex-shrink-0">
                    {wine.photoUrl && (
                      <Image src={wine.photoUrl} alt={wine.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">
                      Vin {index + 1}: {wine.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {wine.domain} {wine.vintage}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleWine(wine.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={wineNotes[wine.id] || ''}
                  onChange={(e) => setWineNotes({ ...wineNotes, [wine.id]: e.target.value })}
                  placeholder="Notes pour ce client (conseils de dégustation, accords mets...)"
                  rows={3}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/shipments">Annuler</Link>
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => handleSave(false)}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Enregistrer brouillon
        </Button>
        <Button
          type="button"
          disabled={loading || selectedWines.length === 0}
          onClick={() => handleSave(true)}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Send className="mr-2 h-4 w-4" />
          Envoyer au client
        </Button>
      </div>
    </div>
  )
}
