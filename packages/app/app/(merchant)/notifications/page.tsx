'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  CheckCheck,
  Loader2,
  MessageSquare,
  RotateCcw,
  UserPlus,
  Wine,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

type NotificationItem = {
  id: number
  type: string
  title: string
  body: string | null
  readAt: string | null
  createdAt: string
}

type Preferences = {
  emailFeedback: boolean
  emailFeedbackFrequency: string
  emailReorder: boolean
  emailInviteAccepted: boolean
  emailGuardReminder: boolean
}

const typeIcons: Record<string, typeof Bell> = {
  feedback: MessageSquare,
  reorder: RotateCcw,
  invite_accepted: UserPlus,
  guard_reminder: Wine,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [showPrefs, setShowPrefs] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [notifsRes, prefsRes] = await Promise.all([
          fetch('/api/proxy/notifications'),
          fetch('/api/proxy/notifications/preferences'),
        ])

        if (notifsRes.ok) {
          const data = await notifsRes.json()
          setNotifications(data.notifications)
        }
        if (prefsRes.ok) {
          const data = await prefsRes.json()
          setPreferences(data.preferences)
        }
      } catch {
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/proxy/notifications/read-all', { method: 'POST' })
      setNotifications(
        notifications.map((n) => ({
          ...n,
          readAt: n.readAt || new Date().toISOString(),
        }))
      )
      toast.success('Toutes les notifications marquées comme lues')
    } catch {
      toast.error('Erreur')
    }
  }

  const handleMarkRead = async (id: number) => {
    try {
      await fetch(`/api/proxy/notifications/${id}/read`, { method: 'POST' })
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      )
    } catch {
      toast.error('Erreur')
    }
  }

  const handleSavePrefs = async () => {
    if (!preferences) return
    setSavingPrefs(true)
    try {
      const res = await fetch('/api/proxy/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })
      if (res.ok) {
        toast.success('Préférences sauvegardées')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setSavingPrefs(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Tout est à jour'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrefs(!showPrefs)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Préférences
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Préférences */}
      {showPrefs && preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Préférences de notification</CardTitle>
            <CardDescription>
              Choisissez quelles notifications vous souhaitez recevoir par email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Feedback clients</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={preferences.emailFeedback ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setPreferences({ ...preferences, emailFeedback: !preferences.emailFeedback })
                  }
                >
                  {preferences.emailFeedback ? 'Activé' : 'Désactivé'}
                </Button>
                {preferences.emailFeedback && (
                  <Select
                    value={preferences.emailFeedbackFrequency}
                    onValueChange={(v) =>
                      setPreferences({ ...preferences, emailFeedbackFrequency: v })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Immédiat</SelectItem>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label>Re-commandes</Label>
              <Button
                variant={preferences.emailReorder ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setPreferences({ ...preferences, emailReorder: !preferences.emailReorder })
                }
              >
                {preferences.emailReorder ? 'Activé' : 'Désactivé'}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label>Invitation acceptée</Label>
              <Button
                variant={preferences.emailInviteAccepted ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...preferences,
                    emailInviteAccepted: !preferences.emailInviteAccepted,
                  })
                }
              >
                {preferences.emailInviteAccepted ? 'Activé' : 'Désactivé'}
              </Button>
            </div>

            <Separator />

            <Button onClick={handleSavePrefs} disabled={savingPrefs}>
              {savingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des notifications */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune notification pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell
            const isUnread = !notif.readAt
            return (
              <Card
                key={notif.id}
                className={`cursor-pointer transition-colors ${
                  isUnread ? 'border-primary/30 bg-primary/5' : ''
                }`}
                onClick={() => !notif.readAt && handleMarkRead(notif.id)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-2 rounded-full ${
                      isUnread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      {isUnread && (
                        <Badge variant="default" className="text-xs px-1.5 py-0">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                    {notif.body && (
                      <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
