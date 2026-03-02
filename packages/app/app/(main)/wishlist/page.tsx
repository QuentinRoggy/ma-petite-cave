import { Suspense } from 'react'
import { fetchApi } from '@/lib/api'
import type { Wine } from '@/lib/types'
import { WineCard } from '@/components/wines/wine-card'
import { WineFilters } from '@/components/wines/wine-filters'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart } from 'lucide-react'

interface WishlistPageProps {
  searchParams: Promise<{
    query?: string
    color?: string
  }>
}

async function WishlistList({ searchParams }: WishlistPageProps) {
  const params = await searchParams
  const queryString = new URLSearchParams(
    Object.entries({ ...params, type: 'wishlist' }).filter(([, v]) => v) as [string, string][]
  ).toString()

  const { wines } = await fetchApi<{ wines: Wine[] }>(
    `/wines?${queryString}`,
    { cache: 'no-store' }
  )

  if (wines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Heart className="text-muted-foreground size-12" />
        <div>
          <p className="font-medium">Aucun vin dans la wishlist</p>
          <p className="text-muted-foreground text-sm">
            {params.query || params.color
              ? 'Essayez de modifier vos filtres'
              : 'Ajoutez un vin que vous aimeriez goûter'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {wines.map((wine) => (
        <WineCard key={wine.id} wine={wine} />
      ))}
    </div>
  )
}

function WishlistSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-lg border p-3">
          <Skeleton className="size-20 rounded-md" />
          <div className="flex flex-1 flex-col justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WishlistPage(props: WishlistPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense>
        <WineFilters basePath="/wishlist" />
      </Suspense>
      <Suspense fallback={<WishlistSkeleton />}>
        <WishlistList searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
