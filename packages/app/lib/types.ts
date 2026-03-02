export type WineType = 'cave' | 'wishlist'

export type Wine = {
  id: string
  userId: number
  type: WineType
  name: string
  domain: string | null
  vintage: number | null
  color: 'rouge' | 'blanc' | 'rosé' | 'pétillant' | null
  merchantNotes: string | null
  personalNotes: string | null
  rating: number | null
  photoUrl: string
  createdAt: string
  updatedAt: string | null
}

export type WineFilters = {
  query?: string
  rated?: 'true' | 'false'
  color?: string
}
