'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Wine } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RatingStars } from './rating-stars'
import { WineForm } from './wine-form'
import { ArrowLeft, Pencil, Trash2, Wine as WineIcon } from 'lucide-react'
import { toast } from 'sonner'

const colorLabels: Record<string, string> = {
  rouge: 'Rouge',
  blanc: 'Blanc',
  rosé: 'Rosé',
  pétillant: 'Pétillant',
}

const colorVariants: Record<string, string> = {
  rouge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  blanc: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  rosé: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  pétillant: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
}

export function WineDetail({ wine }: { wine: Wine }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [moving, setMoving] = useState(false)

  const isWishlist = wine.type === 'wishlist'
  const backPath = isWishlist ? '/wishlist' : '/wines'

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/proxy/wines/${wine.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        toast.success('Vin supprimé')
        router.push(backPath)
      }
    } catch {
      toast.error('Erreur lors de la suppression')
      setDeleting(false)
    }
  }

  async function handleMoveToCave() {
    setMoving(true)
    try {
      const res = await fetch(`/api/proxy/wines/${wine.id}/move-to-cave`, { method: 'POST' })
      if (res.ok) {
        toast.success('Vin ajouté à votre cave !')
        router.push(`/wines/${wine.id}`)
      } else {
        toast.error('Erreur lors du déplacement')
        setMoving(false)
      }
    } catch {
      toast.error('Erreur lors du déplacement')
      setMoving(false)
    }
  }

  if (editing) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(false)}
          className="mb-4"
        >
          <ArrowLeft className="size-4" />
          Annuler
        </Button>
        <h1 className="mb-6 text-xl font-semibold">Modifier le vin</h1>
        <WineForm wine={wine} mode="edit" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(backPath)}
        className="self-start"
      >
        <ArrowLeft className="size-4" />
        Retour
      </Button>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={wine.photoUrl}
          alt={wine.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{wine.name}</h1>
            {wine.domain && (
              <p className="text-muted-foreground">{wine.domain}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="outline" size="icon-sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <Trash2 className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Supprimer ce vin ?</DialogTitle>
                  <DialogDescription>
                    Cette action est irréversible. Le vin &quot;{wine.name}&quot; sera
                    définitivement supprimé.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {wine.vintage && (
            <Badge variant="secondary">{wine.vintage}</Badge>
          )}
          {wine.color && (
            <Badge variant="secondary" className={colorVariants[wine.color]}>
              {colorLabels[wine.color]}
            </Badge>
          )}
        </div>

        {!isWishlist && wine.rating !== null && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">Ma note</span>
            <RatingStars value={wine.rating} size="md" />
          </div>
        )}

        {wine.merchantNotes && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">Notes du caviste</span>
            <p className="whitespace-pre-wrap text-sm">{wine.merchantNotes}</p>
          </div>
        )}

        {wine.personalNotes && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">Mes notes</span>
            <p className="whitespace-pre-wrap text-sm">{wine.personalNotes}</p>
          </div>
        )}

        {isWishlist && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg">
                <WineIcon className="size-4" />
                Ajouter à ma cave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Déplacer dans ma cave ?</DialogTitle>
                <DialogDescription>
                  Vous avez acheté ou reçu &quot;{wine.name}&quot; ?
                  Il sera déplacé de votre wishlist vers votre cave.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={handleMoveToCave} disabled={moving}>
                  {moving ? 'Déplacement...' : 'Confirmer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
