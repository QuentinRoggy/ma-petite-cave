'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Loader2,
  RotateCcw,
  Save,
  Star,
  Wine,
  GlassWater,
  CheckCircle,
  Share2,
  Pencil,
  Trash2,
  X,
  Plus,
  Camera,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

type WineDetail = {
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
  notes: string | null
}

type ClientWineDetail = {
  id: number
  status: 'in_cellar' | 'opened' | 'finished'
  rating: number | null
  personalNotes: string | null
  openedAt: string | null
  finishedAt: string | null
  wantsReorder: boolean
  merchantNotes: string | null
  source: 'box' | 'personal'
  wine: WineDetail
  box: { month: string } | null
  merchant: { shopName: string | null } | null
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
  const [deleting, setDeleting] = useState(false)
  const [data, setData] = useState<ClientWineDetail | null>(null)
  const [editing, setEditing] = useState(false)

  const [status, setStatus] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  // Champs d'édition pour les vins personnels
  const [editName, setEditName] = useState('')
  const [editDomain, setEditDomain] = useState('')
  const [editVintage, setEditVintage] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editGrapes, setEditGrapes] = useState('')
  const [editAlcohol, setEditAlcohol] = useState('')
  const [editGuardMin, setEditGuardMin] = useState('')
  const [editGuardMax, setEditGuardMax] = useState('')
  const [editAromas, setEditAromas] = useState<string[]>([])
  const [editFoodPairings, setEditFoodPairings] = useState<string[]>([])
  const [editWineNotes, setEditWineNotes] = useState('')
  const [newAroma, setNewAroma] = useState('')
  const [newPairing, setNewPairing] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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

  const startEditing = () => {
    if (!data) return
    setEditName(data.wine.name)
    setEditDomain(data.wine.domain || '')
    setEditVintage(data.wine.vintage?.toString() || '')
    setEditColor(data.wine.color || '')
    setEditRegion(data.wine.region || '')
    setEditGrapes(data.wine.grapes || '')
    setEditAlcohol(data.wine.alcoholDegree?.toString() || '')
    setEditGuardMin(data.wine.guardMin?.toString() || '')
    setEditGuardMax(data.wine.guardMax?.toString() || '')
    setEditAromas(data.wine.aromas || [])
    setEditFoodPairings(data.wine.foodPairings || [])
    setEditWineNotes(data.wine.notes || '')
    setPhotoPreview(data.wine.photoUrl)
    setPhotoFile(null)
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        status,
        rating,
        personalNotes: notes || null,
      }

      if (data?.source === 'personal' && editing) {
        let photoUrl = data.wine.photoUrl
        if (photoFile) {
          const uploadData = new FormData()
          uploadData.append('photo', photoFile)
          const uploadRes = await fetch('/api/proxy/uploads/wine-photo', {
            method: 'POST',
            body: uploadData,
          })
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json()
            photoUrl = uploadJson.photoUrl
          }
        }

        body.name = editName
        body.domain = editDomain || null
        body.vintage = editVintage ? Number(editVintage) : null
        body.color = editColor || null
        body.region = editRegion || null
        body.grapes = editGrapes || null
        body.alcoholDegree = editAlcohol ? Number(editAlcohol) : null
        body.guardMin = editGuardMin ? Number(editGuardMin) : null
        body.guardMax = editGuardMax ? Number(editGuardMax) : null
        body.aromas = editAromas.length > 0 ? editAromas : null
        body.foodPairings = editFoodPairings.length > 0 ? editFoodPairings : null
        body.notes = editWineNotes || null
        if (photoUrl !== data.wine.photoUrl) body.photoUrl = photoUrl
      }

      const res = await fetch(`/api/proxy/client/wines/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Erreur lors de la sauvegarde')

      toast.success('Modifications enregistrées')
      setEditing(false)

      const refreshRes = await fetch(`/api/proxy/client/wines/${params.id}`)
      if (refreshRes.ok) {
        const json = await refreshRes.json()
        setData(json.clientWine)
        setStatus(json.clientWine.status)
        setRating(json.clientWine.rating)
        setNotes(json.clientWine.personalNotes || '')
      }
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
      const refreshRes = await fetch(`/api/proxy/client/wines/${params.id}`)
      const json = await refreshRes.json()
      setData(json.clientWine)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/proxy/client/wines/${params.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      toast.success('Vin supprimé')
      router.push('/cave')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const addAroma = () => {
    if (newAroma.trim() && !editAromas.includes(newAroma.trim())) {
      setEditAromas([...editAromas, newAroma.trim()])
      setNewAroma('')
    }
  }

  const addPairing = () => {
    if (newPairing.trim() && !editFoodPairings.includes(newPairing.trim())) {
      setEditFoodPairings([...editFoodPairings, newPairing.trim()])
      setNewPairing('')
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
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
  const isPersonal = data.source === 'personal'

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
        {!isPersonal && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Titre */}
        {editing ? (
          <EditWineForm
            editName={editName}
            setEditName={setEditName}
            editDomain={editDomain}
            setEditDomain={setEditDomain}
            editVintage={editVintage}
            setEditVintage={setEditVintage}
            editColor={editColor}
            setEditColor={setEditColor}
            editRegion={editRegion}
            setEditRegion={setEditRegion}
            editGrapes={editGrapes}
            setEditGrapes={setEditGrapes}
            editAlcohol={editAlcohol}
            setEditAlcohol={setEditAlcohol}
            editGuardMin={editGuardMin}
            setEditGuardMin={setEditGuardMin}
            editGuardMax={editGuardMax}
            setEditGuardMax={setEditGuardMax}
            editAromas={editAromas}
            setEditAromas={setEditAromas}
            editFoodPairings={editFoodPairings}
            setEditFoodPairings={setEditFoodPairings}
            editWineNotes={editWineNotes}
            setEditWineNotes={setEditWineNotes}
            newAroma={newAroma}
            setNewAroma={setNewAroma}
            newPairing={newPairing}
            setNewPairing={setNewPairing}
            addAroma={addAroma}
            addPairing={addPairing}
            photoPreview={photoPreview}
            handlePhotoChange={handlePhotoChange}
            removePhoto={() => {
              setPhotoFile(null)
              setPhotoPreview(null)
            }}
          />
        ) : (
          <>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{wine.name}</h1>
                  {wine.domain && <p className="text-muted-foreground">{wine.domain}</p>}
                </div>
                {isPersonal && (
                  <Button variant="ghost" size="icon" onClick={startEditing}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {isPersonal && (
                  <Badge variant="secondary">Personnel</Badge>
                )}
                {wine.vintage && <Badge variant="outline">{wine.vintage}</Badge>}
                {wine.color && (
                  <Badge className={colorClasses[wine.color] || 'bg-gray-100'}>{wine.color}</Badge>
                )}
                {wine.region && <Badge variant="outline">{wine.region}</Badge>}
              </div>
            </div>

            <Separator />

            {/* Détails du vin */}
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
                {wine.notes && isPersonal && (
                  <div>
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{wine.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

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

        {/* Notes du caviste (uniquement pour les vins de box) */}
        {!isPersonal && data.merchantNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Notes de {data.merchant?.shopName || 'votre caviste'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{data.merchantNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Mes notes personnelles */}
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
          {!isPersonal && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReorder}
              disabled={data.wantsReorder}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {data.wantsReorder ? 'Demande envoyée' : "J'en reveux !"}
            </Button>
          )}
          {isPersonal && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce vin ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le vin sera définitivement supprimé de votre cave.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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

function EditWineForm({
  editName,
  setEditName,
  editDomain,
  setEditDomain,
  editVintage,
  setEditVintage,
  editColor,
  setEditColor,
  editRegion,
  setEditRegion,
  editGrapes,
  setEditGrapes,
  editAlcohol,
  setEditAlcohol,
  editGuardMin,
  setEditGuardMin,
  editGuardMax,
  setEditGuardMax,
  editAromas,
  setEditAromas,
  editFoodPairings,
  setEditFoodPairings,
  editWineNotes,
  setEditWineNotes,
  newAroma,
  setNewAroma,
  newPairing,
  setNewPairing,
  addAroma,
  addPairing,
  photoPreview,
  handlePhotoChange,
  removePhoto,
}: {
  editName: string
  setEditName: (v: string) => void
  editDomain: string
  setEditDomain: (v: string) => void
  editVintage: string
  setEditVintage: (v: string) => void
  editColor: string
  setEditColor: (v: string) => void
  editRegion: string
  setEditRegion: (v: string) => void
  editGrapes: string
  setEditGrapes: (v: string) => void
  editAlcohol: string
  setEditAlcohol: (v: string) => void
  editGuardMin: string
  setEditGuardMin: (v: string) => void
  editGuardMax: string
  setEditGuardMax: (v: string) => void
  editAromas: string[]
  setEditAromas: (v: string[]) => void
  editFoodPairings: string[]
  setEditFoodPairings: (v: string[]) => void
  editWineNotes: string
  setEditWineNotes: (v: string) => void
  newAroma: string
  setNewAroma: (v: string) => void
  newPairing: string
  setNewPairing: (v: string) => void
  addAroma: () => void
  addPairing: () => void
  photoPreview: string | null
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removePhoto: () => void
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Modifier le vin</h2>

      {/* Photo */}
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
          <div className="border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary transition-colors">
            <Camera className="h-6 w-6" />
            <span className="text-sm">Modifier la photo</span>
          </div>
        )}
      </label>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du vin *</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Domaine</Label>
            <Input value={editDomain} onChange={(e) => setEditDomain(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Millésime</Label>
              <Input
                type="number"
                min={1900}
                max={2100}
                value={editVintage}
                onChange={(e) => setEditVintage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <Select value={editColor} onValueChange={setEditColor}>
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
            <Label>Région</Label>
            <Input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cépages</Label>
              <Input value={editGrapes} onChange={(e) => setEditGrapes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alcool (%)</Label>
              <Input
                type="number"
                step="0.1"
                min={0}
                max={20}
                value={editAlcohol}
                onChange={(e) => setEditAlcohol(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Garde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum (années)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={editGuardMin}
                onChange={(e) => setEditGuardMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum (années)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={editGuardMax}
                onChange={(e) => setEditGuardMax(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
          {editAromas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {editAromas.map((aroma) => (
                <Badge key={aroma} variant="secondary">
                  {aroma}
                  <button
                    type="button"
                    onClick={() => setEditAromas(editAromas.filter((a) => a !== aroma))}
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
          {editFoodPairings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {editFoodPairings.map((pairing) => (
                <Badge key={pairing} variant="secondary">
                  {pairing}
                  <button
                    type="button"
                    onClick={() =>
                      setEditFoodPairings(editFoodPairings.filter((p) => p !== pairing))
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes du vin</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editWineNotes}
            onChange={(e) => setEditWineNotes(e.target.value)}
            placeholder="Description, conseils..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  )
}
