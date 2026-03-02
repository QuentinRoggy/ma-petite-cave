'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
}

export function PhotoUploader({ value, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const res = await fetch('/api/proxy/uploads/wine-photo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || data.errors?.[0]?.message || "Erreur lors de l'upload")
        return
      }

      onChange(data.photoUrl)
    } catch {
      setError("Erreur lors de l'upload")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (value) {
    return (
      <div className="relative">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
          <Image src={value} alt="Photo du vin" fill className="object-cover" sizes="100vw" />
        </div>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          className="absolute right-2 top-2"
          onClick={() => onChange(null)}
        >
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="text-muted-foreground size-10 animate-spin" />
        ) : (
          <>
            <Camera className="text-muted-foreground size-10" />
            <p className="text-muted-foreground text-sm">Prendre une photo ou choisir</p>
          </>
        )}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.removeAttribute('capture')
            inputRef.current.click()
            inputRef.current.setAttribute('capture', 'environment')
          }
        }}
        disabled={uploading}
      >
        <ImagePlus className="size-4" />
        Choisir depuis la galerie
      </Button>
    </div>
  )
}
