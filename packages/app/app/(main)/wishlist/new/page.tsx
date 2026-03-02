import { WineForm } from '@/components/wines/wine-form'

export default function NewWishlistItemPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Ajouter à ma wishlist</h1>
      <WineForm mode="create" wineType="wishlist" />
    </div>
  )
}
