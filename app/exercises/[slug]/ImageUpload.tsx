'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/Icon'

export default function ImageUpload({ slug, currentImage }: { slug: string; currentImage: string | null }) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(file: File) {
    setLoading(true)
    const form = new FormData()
    form.append('image', file)
    try {
      const res = await fetch(`/api/exercises/${slug}/image`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Icon name="image" size={16} />
        {loading ? 'Uploading…' : currentImage ? 'Replace Image' : 'Upload Image'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
