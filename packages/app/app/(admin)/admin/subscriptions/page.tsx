'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import { Plus, Link2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  fullName: string | null
  shopName?: string | null
}

interface Subscription {
  id: string
  status: string
  createdAt: string
  client: User
  merchant: User & { shopName?: string | null }
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [merchants, setMerchants] = useState<User[]>([])
  const [clients, setClients] = useState<User[]>([])
  const [selectedMerchant, setSelectedMerchant] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/proxy/admin/subscriptions')
      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data.subscriptions)
      }
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const [merchantsRes, clientsRes] = await Promise.all([
        fetch('/api/proxy/admin/users?role=merchant&limit=100'),
        fetch('/api/proxy/admin/users?role=client&limit=100'),
      ])

      if (merchantsRes.ok) {
        const data = await merchantsRes.json()
        setMerchants(data.users)
      }
      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setClients(data.users)
      }
    } catch {
      toast.error('Erreur lors du chargement des utilisateurs')
    }
  }

  useEffect(() => {
    fetchSubscriptions()
    fetchUsers()
  }, [])

  const handleCreate = async () => {
    if (!selectedMerchant || !selectedClient) {
      toast.error('Selectionnez un caviste et un client')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/proxy/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: selectedMerchant,
          clientId: selectedClient,
          status: 'active',
        }),
      })

      if (res.ok) {
        toast.success('Abonnement cree')
        setDialogOpen(false)
        setSelectedMerchant('')
        setSelectedClient('')
        fetchSubscriptions()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur lors de la creation')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/proxy/admin/subscriptions/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Abonnement supprime')
        fetchSubscriptions()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Abonnements</h1>
          <p className="text-muted-foreground">Liens entre cavistes et clients</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Creer un lien
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel abonnement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Caviste</Label>
                <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un caviste" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.shopName || m.fullName || m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName || c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                {creating ? 'Creation...' : 'Creer le lien'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-muted-foreground">Aucun abonnement</p>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-sm text-muted-foreground">Caviste</p>
                      <p className="font-medium">
                        {sub.merchant.shopName || sub.merchant.fullName || sub.merchant.email}
                      </p>
                    </div>
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <p className="font-medium">
                        {sub.client.fullName || sub.client.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        sub.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer l&apos;abonnement ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Le client n&apos;aura plus acces aux box de ce caviste.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(sub.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
