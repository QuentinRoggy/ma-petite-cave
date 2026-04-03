'use client'

import { useState } from 'react'
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

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        let message = 'Une erreur est survenue'
        try {
          const data = await res.json()
          message = data.message || message
        } catch {}
        throw new Error(message)
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Email envoyé</CardTitle>
          <CardDescription>Vérifiez votre boîte mail</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Si cet email est associé à un compte, vous recevrez un lien de réinitialisation dans
            quelques minutes.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="text-sm text-primary underline">
            Retour à la connexion
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
        <CardDescription>
          Entrez votre email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground underline">
            Retour à la connexion
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
