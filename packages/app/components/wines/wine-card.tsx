import Link from 'next/link'
import Image from 'next/image'
import type { Wine } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { RatingStars } from './rating-stars'

const colorLabels: Record<string, string> = {
  rouge: 'Rouge',
  blanc: 'Blanc',
  rosé: 'Rosé',
  pétillant: 'Pétillant',
}

const colorVariants: Record<string, string> = {
  rouge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  blanc: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  rosé: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  pétillant: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
}

export function WineCard({ wine }: { wine: Wine }) {
  const href = wine.type === 'wishlist' ? `/wishlist/${wine.id}` : `/wines/${wine.id}`

  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={wine.photoUrl}
          alt={wine.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="font-medium leading-tight truncate">{wine.name}</h3>
          {wine.domain && (
            <p className="text-muted-foreground text-sm truncate">{wine.domain}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {wine.vintage && (
            <span className="text-muted-foreground text-xs">{wine.vintage}</span>
          )}
          {wine.color && (
            <Badge variant="secondary" className={colorVariants[wine.color]}>
              {colorLabels[wine.color]}
            </Badge>
          )}
          {wine.type === 'cave' && wine.rating !== null && <RatingStars value={wine.rating} size="sm" />}
        </div>
      </div>
    </Link>
  )
}
