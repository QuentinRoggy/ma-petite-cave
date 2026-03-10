'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Send, Trash2, Wine as WineIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

type BoxDetail = {
  id: number
  month: string
  status: 'draft' | 'sent'
  sentAt: string | null
  createdAt: string
  client: {
    id: number
    fullName: string | null
    email: string
  }
  wines: Array<{
    id: number
    wine: {
      id: string
      name: string
      domain: string | null
      vintage: number | null
      color: string | null
      photoUrl: string | null
    }
    merchantNotes: string | null
    clientFeedback: {
      rating: number | null
      status: string
      personalNotes: string | null
    } | null
  }>
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
}

const colorClasses: Record<string, string> = {
  rouge: 'bg-red-100 text-red-800',
  blanc: 'bg-yellow-100 text-yellow-800',
  rosé: 'bg-pink-100 text-pink-800',
  pétillant: 'bg-blue-100 text-blue-800',
}

export default function ShipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [box, setBox] = useState<BoxDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchBox() {
      try {
        const res = await fetch(`/api/proxy/merchant/boxes/${params.id}`)
        if (!res.ok) throw new Error('Box non trouvée')
        const data = await res.json()
        setBox(data.box)
      } catch {
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchBox()
  }, [params.id])

  const handleSend = async () => {
    if (!confirm('Envoyer cette box au client ?')) return

    setSending(true)
    try {
      const res = await fetch(`/api/proxy/merchant/boxes/${params.id}/send`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }
      toast.success('Box envoyée au client !')
      router.refresh()
      // Refresh data
      const refreshRes = await fetch(`/api/proxy/merchant/boxes/${params.id}`)
      const data = await refreshRes.json()
      setBox(data.box)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette box ?')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/proxy/merchant/boxes/${params.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }
      toast.success('Box supprimée')
      router.push('/shipments')
      router.refresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
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

  if (!box) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/shipments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Box non trouvée</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/shipments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Box{' '}
              {new Date(box.month + '-01').toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric',
              })}
            </h1>
            <p className="text-muted-foreground">
              {box.client.fullName || box.client.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[box.status]}>{statusLabels[box.status]}</Badge>
          {box.status === 'draft' && (
            <>
              <Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Envoyer
              </Button>
            </>
          )}
        </div>
      </div>

      {box.sentAt && (
        <p className="text-sm text-muted-foreground">
          Envoyée le{' '}
          {new Date(box.sentAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {/* Vins */}
      <div className="space-y-4">
        {box.wines.map((item, index) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-28 relative bg-muted rounded overflow-hidden flex-shrink-0">
                  {item.wine.photoUrl ? (
                    <Image
                      src={item.wine.photoUrl}
                      alt={item.wine.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <WineIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Vin {index + 1}: {item.wine.name}
                      </h3>
                      {item.wine.domain && (
                        <p className="text-sm text-muted-foreground">{item.wine.domain}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {item.wine.vintage && (
                        <Badge variant="outline">{item.wine.vintage}</Badge>
                      )}
                      {item.wine.color && (
                        <Badge className={colorClasses[item.wine.color] || 'bg-gray-100'}>
                          {item.wine.color}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {item.merchantNotes && (
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-xs text-muted-foreground mb-1">Vos notes</p>
                      <p className="text-sm whitespace-pre-wrap">{item.merchantNotes}</p>
                    </div>
                  )}

                  {item.clientFeedback && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Feedback client</p>
                      <div className="flex items-center gap-4">
                        {item.clientFeedback.rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">
                              {'★'.repeat(item.clientFeedback.rating)}
                              {'☆'.repeat(5 - item.clientFeedback.rating)}
                            </span>
                          </div>
                        )}
                        <Badge variant="outline">
                          {item.clientFeedback.status === 'in_cellar' && 'En cave'}
                          {item.clientFeedback.status === 'opened' && 'Ouverte'}
                          {item.clientFeedback.status === 'finished' && 'Terminée'}
                        </Badge>
                      </div>
                      {item.clientFeedback.personalNotes && (
                        <p className="text-sm mt-2 italic">
                          "{item.clientFeedback.personalNotes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
