'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number | null
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
}

export function RatingStars({ value, onChange, size = 'sm' }: RatingStarsProps) {
  const stars = [1, 2, 3, 4, 5]
  const iconSize = size === 'sm' ? 'size-4' : 'size-5'

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(value === star ? 0 : star)}
          className={cn(
            'transition-colors',
            onChange ? 'cursor-pointer hover:text-yellow-400' : 'cursor-default'
          )}
        >
          <Star
            className={cn(
              iconSize,
              star <= (value ?? 0)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/40'
            )}
          />
        </button>
      ))}
    </div>
  )
}
