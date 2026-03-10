import { cookies } from 'next/headers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Wine as WineIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

type Wine = {
  id: string
  name: string
  domain: string | null
  vintage: number | null
  color: string | null
  region: string | null
  photoUrl: string | null
}

async function getWines(query?: string, color?: string): Promise<Wine[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return []

  try {
    const url = new URL(`${API_URL}/merchant/wines`)
    if (query) url.searchParams.set('query', query)
    if (color && color !== 'all') url.searchParams.set('color', color)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.wines || []
  } catch {
    return []
  }
}

const colorLabels: Record<string, string> = {
  rouge: 'Rouge',
  blanc: 'Blanc',
  rosé: 'Rosé',
  pétillant: 'Pétillant',
}

const colorClasses: Record<string, string> = {
  rouge: 'bg-red-100 text-red-800',
  blanc: 'bg-yellow-100 text-yellow-800',
  rosé: 'bg-pink-100 text-pink-800',
  pétillant: 'bg-blue-100 text-blue-800',
}

export default async function WinesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; color?: string }>
}) {
  const params = await searchParams
  const wines = await getWines(params.query, params.color)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catalogue</h1>
          <p className="text-muted-foreground">Gérez votre catalogue de vins</p>
        </div>
        <Button asChild>
          <Link href="/wines/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un vin
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <form className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="query"
            placeholder="Rechercher un vin..."
            defaultValue={params.query}
            className="pl-10"
          />
        </div>
        <Select name="color" defaultValue={params.color || 'all'}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Couleur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="rouge">Rouge</SelectItem>
            <SelectItem value="blanc">Blanc</SelectItem>
            <SelectItem value="rosé">Rosé</SelectItem>
            <SelectItem value="pétillant">Pétillant</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          Filtrer
        </Button>
      </form>

      {/* Grid */}
      {wines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WineIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {params.query || params.color ? 'Aucun vin trouvé' : 'Catalogue vide'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              {params.query || params.color
                ? 'Essayez avec d\'autres critères de recherche.'
                : 'Ajoutez des vins à votre catalogue pour pouvoir créer des box.'}
            </p>
            {!params.query && !params.color && (
              <Button asChild>
                <Link href="/wines/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un vin
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {wines.map((wine) => (
            <Link key={wine.id} href={`/wines/${wine.id}`}>
              <Card className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <div className="aspect-[3/4] relative bg-muted">
                  {wine.photoUrl ? (
                    <Image
                      src={wine.photoUrl}
                      alt={wine.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <WineIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium truncate">{wine.name}</h3>
                  {wine.domain && (
                    <p className="text-sm text-muted-foreground truncate">
                      {wine.domain}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {wine.vintage && (
                      <span className="text-sm font-medium">{wine.vintage}</span>
                    )}
                    {wine.color && (
                      <Badge className={colorClasses[wine.color] || 'bg-gray-100'}>
                        {colorLabels[wine.color] || wine.color}
                      </Badge>
                    )}
                  </div>
                  {wine.region && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {wine.region}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
