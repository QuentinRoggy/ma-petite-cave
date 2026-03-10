// Wine in merchant's catalog
export type Wine = {
  id: string
  merchantId: number
  name: string
  domain: string | null
  vintage: number | null
  color: 'rouge' | 'blanc' | 'rosé' | 'pétillant' | null
  region: string | null
  grapes: string | null
  alcoholDegree: number | null
  aromas: string[] | null
  foodPairings: string[] | null
  guardMin: number | null
  guardMax: number | null
  photoUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

export type WineFilters = {
  query?: string
  color?: string
}

// Subscription (client chez un caviste)
export type Subscription = {
  id: number
  clientId: number
  merchantId: number
  status: 'pending_invite' | 'active' | 'paused' | 'cancelled'
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

// Box mensuelle
export type Box = {
  id: number
  subscriptionId: number
  month: string
  status: 'draft' | 'sent'
  sentAt: string | null
  createdAt: string
  updatedAt: string | null
}

// Vin dans une box
export type BoxWine = {
  id: number
  boxId: number
  wineId: string | null
  merchantNotes: string | null
  position: number
  wine?: Wine
}

// Exemplaire du vin chez le client
export type ClientWine = {
  id: number
  boxWineId: number
  clientId: number
  status: 'in_cellar' | 'opened' | 'finished'
  rating: number | null
  personalNotes: string | null
  openedAt: string | null
  finishedAt: string | null
  wantsReorder: boolean
  reorderRequestedAt: string | null
  createdAt: string
  updatedAt: string | null
  boxWine?: BoxWine
}
