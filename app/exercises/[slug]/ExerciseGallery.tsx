'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/Icon'

const FRAME_LABELS: Record<2 | 3, string[]> = {
  2: ['Start', 'Finish'],
  3: ['Setup', 'Drive', 'Lock'],
}

export default function ExerciseGallery({
  slug,
  name,
  secondaryCount,
  images,
}: {
  slug: string
  name: string
  secondaryCount: number
  images: (string | null)[]
}) {
  const frameCount: 2 | 3 = secondaryCount >= 2 ? 3 : 2
  const labels = FRAME_LABELS[frameCount]
  const [frame, setFrame] = useState(0)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const imgAt = (i: number) => images[i] ?? null
  const current = imgAt(frame)

  function goto(i: number) {
    if (i === frame) return
    setDir(i > frame ? 'next' : 'prev')
    setFrame(i)
  }

  async function handleFile(file: File) {
    setLoading(true)
    const form = new FormData()
    form.append('image', file)
    form.append('frame', String(frame))
    try {
      const res = await fetch(`/api/exercises/${slug}/image`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ex-gallery">
      <div className="ex-frame ex-frame-main">
        <div key={frame} className="ex-frame-slide" data-dir={dir}>
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current} alt={`${name} — ${labels[frame]}`} />
          ) : (
            <span className="ex-frame-cap">{name} · demo</span>
          )}
        </div>
      </div>

      {frameCount > 1 && (
        <div className="ex-gallery-thumbs">
          {labels.map((label, i) => {
            const thumb = imgAt(i)
            return (
              <button
                key={i}
                className={`ex-thumb${i === frame ? ' active' : ''}`}
                onClick={() => goto(i)}
                aria-label={`${label} frame`}
              >
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" aria-hidden />
                )}
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      )}

      <button
        className="btn btn-ghost btn-sm replace-btn"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Icon name="image" size={16} />
        {loading ? 'Uploading…' : current ? `Replace ${labels[frame]} image` : `Add ${labels[frame]} image`}
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
