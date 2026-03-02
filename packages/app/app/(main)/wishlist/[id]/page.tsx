import { notFound } from 'next/navigation'
import { fetchApi } from '@/lib/api'
import type { Wine } from '@/lib/types'
import { WineDetail } from '@/components/wines/wine-detail'

interface WishlistItemPageProps {
  params: Promise<{ id: string }>
}

export default async function WishlistItemPage({ params }: WishlistItemPageProps) {
  const { id } = await params

  let wine: Wine
  try {
    const data = await fetchApi<{ wine: Wine }>(`/wines/${id}`, { cache: 'no-store' })
    wine = data.wine
  } catch {
    notFound()
  }

  return <WineDetail wine={wine} />
}
