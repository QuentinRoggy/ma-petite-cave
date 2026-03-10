'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Play, MessageSquare, Wine, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminJobsPage() {
  const [runningJob, setRunningJob] = useState<string | null>(null)
  const [digestFrequency, setDigestFrequency] = useState('daily')

  const runJob = async (jobType: string, queryParams?: string) => {
    setRunningJob(jobType)
    try {
      const url = `/api/proxy/admin/jobs/${jobType}${queryParams ? `?${queryParams}` : ''}`
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Erreur')
      toast.success(data.message)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setRunningJob(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jobs & Tâches planifiées</h1>
        <p className="text-muted-foreground">
          Lancez manuellement les jobs ou consultez leur statut
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Feedback Digest */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Digest Feedback
            </CardTitle>
            <CardDescription>
              Envoie un email récapitulatif des nouveaux avis aux cavistes.
              Normalement exécuté quotidiennement via cron.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={digestFrequency} onValueChange={setDigestFrequency}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => runJob('feedback-digest', `frequency=${digestFrequency}`)}
                disabled={runningJob === 'feedback-digest'}
              >
                {runningJob === 'feedback-digest' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Lancer maintenant
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Cron recommandé : tous les jours à 8h
            </div>
          </CardContent>
        </Card>

        {/* Guard Reminder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5" />
              Rappels de garde
            </CardTitle>
            <CardDescription>
              Vérifie les vins en cave dont la garde optimale est atteinte
              et envoie un email aux clients concernés.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => runJob('guard-reminder')}
              disabled={runningJob === 'guard-reminder'}
            >
              {runningJob === 'guard-reminder' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Lancer maintenant
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Cron recommandé : tous les jours à 9h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info cron */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration cron (production)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
            <code>{`# Digest feedback quotidien - tous les jours à 8h
0 8 * * * cd /path/to/api && node ace queue:dispatch FeedbackDigestJob '{"frequency":"daily"}'

# Rappels de garde - tous les jours à 9h
0 9 * * * cd /path/to/api && node ace queue:dispatch GuardReminderJob '{}'

# Worker Bull Queue (à lancer en tant que service)
# node ace queue:listen`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
