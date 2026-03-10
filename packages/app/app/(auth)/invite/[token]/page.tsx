'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Wine } from 'lucide-react'
import { toast } from 'sonner'

type InvitationInfo = {
  id: number
  shopName: string
  merchantName: string | null
}

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '',
    fullName: '',
    password: '',
  })

  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/invite/${params.token}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.message || 'Invitation invalide')
          return
        }

        setInvitation(data.invitation)
      } catch {
        setError('Erreur lors de la vérification')
      } finally {
        setLoading(false)
      }
    }
    verifyToken()
  }, [params.token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/auth/invite/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erreur lors de la création du compte')
        return
      }

      toast.success(data.message || 'Bienvenue !')
      router.push('/boxes')
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Wine className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">Invitation invalide</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/login')} variant="outline">
              Aller à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wine className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bienvenue sur Cuvee</CardTitle>
          <CardDescription>
            <strong>{invitation?.shopName}</strong> vous invite à rejoindre Cuvee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="votre@email.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Votre nom complet</Label>
              <Input
                id="fullName"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="8 caractères minimum"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wine className="mr-2 h-4 w-4" />
              )}
              Créer mon compte
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
