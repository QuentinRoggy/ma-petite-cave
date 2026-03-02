'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const colors = [
  { value: 'rouge', label: 'Rouge' },
  { value: 'blanc', label: 'Blanc' },
  { value: 'rosé', label: 'Rosé' },
  { value: 'pétillant', label: 'Pétillant' },
]

interface WineFiltersProps {
  basePath?: string
}

export function WineFilters({ basePath = '/wines' }: WineFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const query = searchParams.get('query') || ''
  const rated = searchParams.get('rated') || ''
  const color = searchParams.get('color') || ''

  const showRatedFilters = basePath !== '/wishlist'

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`)
      })
    },
    [router, searchParams, basePath]
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Rechercher un vin..."
          defaultValue={query}
          onChange={(e) => {
            const timeout = setTimeout(() => {
              updateParams({ query: e.target.value })
            }, 300)
            return () => clearTimeout(timeout)
          }}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {showRatedFilters && (
          <>
            <Button
              variant={rated === 'true' ? 'default' : 'outline'}
              size="xs"
              onClick={() => updateParams({ rated: rated === 'true' ? '' : 'true' })}
            >
              Notés
            </Button>
            <Button
              variant={rated === 'false' ? 'default' : 'outline'}
              size="xs"
              onClick={() => updateParams({ rated: rated === 'false' ? '' : 'false' })}
            >
              Non notés
            </Button>
            <div className="h-6 w-px bg-border" />
          </>
        )}
        {colors.map((c) => (
          <Badge
            key={c.value}
            variant={color === c.value ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => updateParams({ color: color === c.value ? '' : c.value })}
          >
            {c.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
