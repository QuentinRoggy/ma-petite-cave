import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Store, Wine, Package } from 'lucide-react'
import { cookies } from 'next/headers'

async function getStats() {
  const cookieStore = await cookies()
  const token = cookieStore.get('mpc_token')?.value

  if (!token) {
    return null
  }

  const res = await fetch(`${process.env.API_URL}/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    return null
  }

  return res.json()
}

export default async function AdminDashboardPage() {
  const data = await getStats()

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Impossible de charger les statistiques.</p>
      </div>
    )
  }

  const { stats, recentUsers } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de la plateforme</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.adminCount} admin, {stats.merchantCount} cavistes, {stats.clientCount} clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cavistes</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.merchantCount}</div>
            <p className="text-xs text-muted-foreground">
              Comptes professionnels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vins</CardTitle>
            <Wine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWines}</div>
            <p className="text-xs text-muted-foreground">
              Dans tous les catalogues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Box envoyees</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBoxesSent}</div>
            <p className="text-xs text-muted-foreground">
              Livrees aux clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers utilisateurs inscrits</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun utilisateur recent</p>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user: { id: string; email: string; role: string; fullName: string | null; createdAt: string }) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.fullName || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-orange-100 text-orange-800'
                        : user.role === 'merchant'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </p>
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
