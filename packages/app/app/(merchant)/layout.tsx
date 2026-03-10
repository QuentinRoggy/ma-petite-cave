'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Wine,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  RotateCcw,
  BarChart3,
  Bell,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Catalogue', href: '/wines', icon: Wine },
  { name: 'Box', href: '/shipments', icon: Package },
  { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  { name: 'Re-commandes', href: '/reorders', icon: RotateCcw, showBadge: true },
  { name: 'Statistiques', href: '/stats', icon: BarChart3 },
  { name: 'Notifications', href: '/notifications', icon: Bell, showNotifBadge: true },
]

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reorderCount, setReorderCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [reorderRes, notifRes] = await Promise.all([
          fetch('/api/proxy/merchant/reorders/count'),
          fetch('/api/proxy/notifications/unread/count'),
        ])
        if (reorderRes.ok) {
          const data = await reorderRes.json()
          setReorderCount(data.count || 0)
        }
        if (notifRes.ok) {
          const data = await notifRes.json()
          setNotifCount(data.count || 0)
        }
      } catch {
        // Ignore errors
      }
    }
    fetchCounts()
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <span className="font-semibold text-lg">Cuvee</span>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const showReorderBadge = 'showBadge' in item && item.showBadge && reorderCount > 0
              const showNotifBadge = 'showNotifBadge' in item && item.showNotifBadge && notifCount > 0
              const badgeCount = showReorderBadge ? reorderCount : showNotifBadge ? notifCount : 0
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                  {badgeCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {badgeCount}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Settings & Logout */}
          <div className="p-4 border-t space-y-1">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Parametres
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full"
            >
              <LogOut className="h-5 w-5" />
              Deconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-4 px-4 border-b bg-background md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Cuvee</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
