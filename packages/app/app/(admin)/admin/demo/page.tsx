'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
import { FlaskConical, Trash2, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SetupResult {
  message: string
  merchant: { email: string; password: string; created: boolean }
  client: { email: string; password: string; created: boolean }
  subscription: { created: boolean }
  wines: { total: number; created: number }
  box: { created: boolean; month: string }
}

export default function AdminDemoPage() {
  const [setupConfig, setSetupConfig] = useState({
    merchantEmail: 'demo-caviste@ma-petite-cave.fr',
    clientEmail: 'demo-client@ma-petite-cave.fr',
    merchantName: 'Jean Caviste',
    clientName: 'Marie Cliente',
    shopName: 'Cave du Chateau',
    password: 'demo1234',
  })
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [result, setResult] = useState<SetupResult | null>(null)

  const handleSetup = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/proxy/admin/demo/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupConfig),
      })

      if (res.ok) {
        const data = await res.json()
        setResult(data)
        toast.success('Demo configuree avec succes')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la configuration')
      }
    } catch {
      toast.error('Erreur lors de la configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/proxy/admin/demo/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantEmail: setupConfig.merchantEmail,
          clientEmail: setupConfig.clientEmail,
        }),
      })

      if (res.ok) {
        toast.success('Demo reinitialise')
        setResult(null)
      } else {
        toast.error('Erreur lors de la reinitialisation')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Outils Demo</h1>
        <p className="text-muted-foreground">Configuration rapide pour les demonstrations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Configuration Demo
            </CardTitle>
            <CardDescription>
              Cree automatiquement un caviste, un client, des vins et des box pour une demo complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="merchantEmail">Email caviste</Label>
                <Input
                  id="merchantEmail"
                  value={setupConfig.merchantEmail}
                  onChange={(e) =>
                    setSetupConfig({ ...setupConfig, merchantEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="merchantName">Nom caviste</Label>
                <Input
                  id="merchantName"
                  value={setupConfig.merchantName}
                  onChange={(e) =>
                    setSetupConfig({ ...setupConfig, merchantName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shopName">Nom de la boutique</Label>
              <Input
                id="shopName"
                value={setupConfig.shopName}
                onChange={(e) =>
                  setSetupConfig({ ...setupConfig, shopName: e.target.value })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="clientEmail">Email client</Label>
                <Input
                  id="clientEmail"
                  value={setupConfig.clientEmail}
                  onChange={(e) =>
                    setSetupConfig({ ...setupConfig, clientEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="clientName">Nom client</Label>
                <Input
                  id="clientName"
                  value={setupConfig.clientName}
                  onChange={(e) =>
                    setSetupConfig({ ...setupConfig, clientName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Mot de passe (pour les deux comptes)</Label>
              <Input
                id="password"
                value={setupConfig.password}
                onChange={(e) =>
                  setSetupConfig({ ...setupConfig, password: e.target.value })
                }
              />
            </div>

            <Button onClick={handleSetup} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Configuration en cours...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Configurer la demo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result & Reset */}
        <div className="space-y-6">
          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Check className="h-5 w-5" />
                  Demo configuree
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Compte Caviste</p>
                  <p className="font-mono">{result.merchant.email}</p>
                  <p className="text-sm text-gray-500">Mot de passe: {result.merchant.password}</p>
                  {result.merchant.created && (
                    <span className="text-xs text-green-600">Nouveau compte cree</span>
                  )}
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Compte Client</p>
                  <p className="font-mono">{result.client.email}</p>
                  <p className="text-sm text-gray-500">Mot de passe: {result.client.password}</p>
                  {result.client.created && (
                    <span className="text-xs text-green-600">Nouveau compte cree</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-white rounded">
                    <p className="text-gray-600">Vins</p>
                    <p className="font-bold">{result.wines.total}</p>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <p className="text-gray-600">Box</p>
                    <p className="font-bold">{result.box.month}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Reinitialiser
              </CardTitle>
              <CardDescription>
                Supprime tous les comptes et donnees de demo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={resetting}>
                    {resetting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reinitialisation...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reinitialiser la demo
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reinitialiser la demo ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera les comptes demo ({setupConfig.merchantEmail} et{' '}
                      {setupConfig.clientEmail}) ainsi que toutes leurs donnees.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Reinitialiser
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
