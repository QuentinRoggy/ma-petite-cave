'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wine, Heart, LogOut, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const isWishlist = pathname.startsWith('/wishlist')

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/wines" className="flex items-center gap-2 font-semibold">
            <Wine className="size-5" />
            <span>Ma Petite Cave</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" asChild>
              <Link href={isWishlist ? '/wishlist/new' : '/wines/new'}>
                <Plus className="size-4" />
                Ajouter
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Se déconnecter">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl">
          <Link
            href="/wines"
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
              !isWishlist ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Wine className="size-5" />
            Ma Cave
          </Link>
          <Link
            href="/wishlist"
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
              isWishlist ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Heart className={cn('size-5', isWishlist && 'fill-current')} />
            Wishlist
          </Link>
        </div>
      </nav>
      <Toaster richColors />
    </div>
  )
}
