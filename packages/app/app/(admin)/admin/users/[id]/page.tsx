'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ArrowLeft, Trash2, UserCheck, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface UserDetails {
  id: string
  email: string
  fullName: string | null
  role: 'client' | 'merchant' | 'admin'
  shopName?: string | null
  address?: string | null
  phone?: string | null
  createdAt: string
}

interface Subscription {
  id: string
  status: string
  createdAt: string
  otherUser: {
    id: string
    email: string
    fullName: string | null
    shopName?: string | null
  }
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: '' as string,
    shopName: '',
    address: '',
    phone: '',
    password: '',
  })

  useEffect(() => {
    fetchUser()
  }, [resolvedParams.id])

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/proxy/admin/users/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setStats(data.stats || {})
        setSubscriptions(data.subscriptions || [])
        setFormData({
          email: data.user.email,
          fullName: data.user.fullName || '',
          role: data.user.role,
          shopName: data.user.shopName || '',
          address: data.user.address || '',
          phone: data.user.phone || '',
          password: '',
        })
      } else {
        toast.error('Utilisateur non trouve')
        router.push('/admin/users')
      }
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updateData: Record<string, string | null> = {
        email: formData.email,
        fullName: formData.fullName || null,
        role: formData.role,
      }
      if (formData.password) {
        updateData.password = formData.password
      }
      if (formData.role === 'merchant') {
        updateData.shopName = formData.shopName || null
        updateData.address = formData.address || null
        updateData.phone = formData.phone || null
      }

      const res = await fetch(`/api/proxy/admin/users/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        toast.success('Utilisateur mis a jour')
        fetchUser()
        setFormData((prev) => ({ ...prev, password: '' }))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/proxy/admin/users/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Utilisateur supprime')
        router.push('/admin/users')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleImpersonate = async () => {
    try {
      const res = await fetch(`/api/proxy/admin/users/${resolvedParams.id}/impersonate`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        // Store the token in cookies via API
        await fetch('/api/auth/impersonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.token, role: data.user.role }),
        })
        toast.success(`Connexion en tant que ${data.user.email}`)
        // Redirect based on role
        if (data.user.role === 'merchant') {
          router.push('/dashboard')
        } else {
          router.push('/boxes')
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur lors de l\'impersonation')
    }
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  if (!user) {
    return <div className="p-6">Utilisateur non trouve</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{user.fullName || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="merchant">Caviste</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'merchant' && (
              <>
                <div>
                  <Label htmlFor="shopName">Nom de la boutique</Label>
                  <Input
                    id="shopName"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telephone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </CardContent>
        </Card>

        {/* Stats & Actions */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
                {Object.keys(stats).length === 0 && (
                  <p className="text-muted-foreground text-sm">Aucune statistique</p>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.role !== 'admin' && (
                <Button onClick={handleImpersonate} variant="secondary" className="w-full">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Se connecter en tant que
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer l&apos;utilisateur
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irreversible. Toutes les donnees associees seront supprimees.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Subscriptions */}
          {subscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {user.role === 'merchant' ? 'Clients' : 'Cavistes'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">
                          {sub.otherUser.fullName || sub.otherUser.email}
                        </p>
                        {sub.otherUser.shopName && (
                          <p className="text-sm text-blue-600">{sub.otherUser.shopName}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sub.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
