import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, TrendingUp, Users, Wine as WineIcon } from 'lucide-react'
import Image from 'next/image'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

type Feedback = {
  id: number
  rating: number
  personalNotes: string | null
  status: string
  updatedAt: string
  client: {
    id: number
    fullName: string | null
    email: string
  }
  wine: {
    id: string
    name: string
    domain: string | null
    vintage: number | null
    photoUrl: string | null
  }
  box: {
    month: string
  }
}

type Stats = {
  total: number
  rated: number
  ratingRate: number
  avgRating: number
  byRating: Array<{ rating: number; count: number }>
  byStatus: {
    in_cellar: number
    opened: number
    finished: number
  }
}

async function getFeedbackData(): Promise<{ feedbacks: Feedback[]; stats: Stats }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    return {
      feedbacks: [],
      stats: {
        total: 0,
        rated: 0,
        ratingRate: 0,
        avgRating: 0,
        byRating: [],
        byStatus: { in_cellar: 0, opened: 0, finished: 0 },
      },
    }
  }

  try {
    const [feedbackRes, statsRes] = await Promise.all([
      fetch(`${API_URL}/merchant/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/merchant/feedback/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ])

    const feedbackData = await feedbackRes.json()
    const statsData = await statsRes.json()

    return {
      feedbacks: feedbackData.feedbacks || [],
      stats: statsData.stats || {
        total: 0,
        rated: 0,
        ratingRate: 0,
        avgRating: 0,
        byRating: [],
        byStatus: { in_cellar: 0, opened: 0, finished: 0 },
      },
    }
  } catch {
    return {
      feedbacks: [],
      stats: {
        total: 0,
        rated: 0,
        ratingRate: 0,
        avgRating: 0,
        byRating: [],
        byStatus: { in_cellar: 0, opened: 0, finished: 0 },
      },
    }
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `il y a ${diffMins} min`
  } else if (diffHours < 24) {
    return `il y a ${diffHours}h`
  } else if (diffDays < 7) {
    return `il y a ${diffDays}j`
  } else {
    return date.toLocaleDateString('fr-FR')
  }
}

export default async function FeedbackPage() {
  const { feedbacks, stats } = await getFeedbackData()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feedback clients</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vins notés</CardTitle>
            <WineIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rated}</div>
            <p className="text-xs text-muted-foreground">
              sur {stats.total} distribués ({stats.ratingRate}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.avgRating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Distribution</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[...stats.byRating].reverse().map((r) => (
                <div key={r.rating} className="flex items-center gap-2 text-sm">
                  <span className="w-4">{r.rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: stats.rated > 0 ? `${(r.count / stats.rated) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Statut vins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>En cave</span>
                <span className="font-medium">{stats.byStatus.in_cellar}</span>
              </div>
              <div className="flex justify-between">
                <span>Ouverts</span>
                <span className="font-medium">{stats.byStatus.opened}</span>
              </div>
              <div className="flex justify-between">
                <span>Terminés</span>
                <span className="font-medium">{stats.byStatus.finished}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des feedbacks */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Derniers avis</h2>
        {feedbacks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Aucun feedback pour le moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Photo du vin */}
                    <div className="w-16 h-20 relative bg-muted rounded overflow-hidden flex-shrink-0">
                      {feedback.wine.photoUrl ? (
                        <Image
                          src={feedback.wine.photoUrl}
                          alt={feedback.wine.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <WineIcon className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium truncate">{feedback.wine.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {feedback.client.fullName || feedback.client.email}
                          </p>
                        </div>
                        <div className="flex items-center text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < feedback.rating ? 'fill-current' : 'text-muted'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {feedback.personalNotes && (
                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                          &quot;{feedback.personalNotes}&quot;
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimeAgo(feedback.updatedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
