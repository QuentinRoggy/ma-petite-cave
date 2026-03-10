'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      email: formData.get('email'),
      fullName: formData.get('fullName'),
      phone: formData.get('phone') || undefined,
      password: formData.get('password'),
      notes: formData.get('notes') || undefined,
    }

    try {
      const res = await fetch('/api/proxy/merchant/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.message || 'Erreur lors de la création')
      }

      router.push('/clients')
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
          <Link href="/clients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouveau client</h1>
          <p className="text-muted-foreground">Créez un compte pour votre client</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>
            Ces informations permettront à votre client de se connecter à son espace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe initial *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 caractères"
                  minLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Le client pourra le modifier plus tard
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (visible uniquement par vous)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Préférences, allergies, infos utiles..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/clients">Annuler</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer le client
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
