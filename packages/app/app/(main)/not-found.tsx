import Link from 'next/link'
import { Wine } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <Wine className="size-12 text-muted-foreground" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Page introuvable</h1>
        <p className="text-muted-foreground">
          Ce vin n&apos;existe pas ou a été supprimé.
        </p>
      </div>
      <Button asChild>
        <Link href="/wines">Retour à ma cave</Link>
      </Button>
    </div>
  )
}
