'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Role = 'client' | 'merchant'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role>('client')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const payload: Record<string, string> = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role,
    }

    // Ajouter shopName si c'est un caviste
    if (role === 'merchant') {
      payload.shopName = formData.get('shopName') as string
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.errors?.[0]?.message || data.message || "Erreur lors de l'inscription")
        return
      }

      // Le middleware redirigera vers la bonne page selon le rôle
      router.push('/')
      router.refresh()
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Créer un compte</CardTitle>
        <CardDescription>Rejoignez Cuvee</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          {/* Sélection du rôle */}
          <div className="flex flex-col gap-2">
            <Label>Je suis</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={cn(
                  'p-3 rounded-md border text-sm font-medium transition-colors',
                  role === 'client'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input hover:bg-muted'
                )}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole('merchant')}
                className={cn(
                  'p-3 rounded-md border text-sm font-medium transition-colors',
                  role === 'merchant'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input hover:bg-muted'
                )}
              >
                Caviste
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
            />
          </div>

          {role === 'merchant' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="shopName">Nom de la boutique</Label>
              <Input
                id="shopName"
                name="shopName"
                type="text"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Inscription...' : "S'inscrire"}
          </Button>
          <p className="text-muted-foreground text-sm">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
