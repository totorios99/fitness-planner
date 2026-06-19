'use client'

import { useRef, useState } from 'react'
import { Icon } from '@/components/Icon'

export default function MobilityVideo({
  slug, initialVideo,
}: {
  slug: string
  initialVideo: string | null
}) {
  const [video, setVideo] = useState(initialVideo)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    if (!file.type.startsWith('video/')) { setError('Must be a video file'); return }
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('video', file)
      const res = await fetch(`/api/exercises/${slug}/video`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setVideo(data.videoPath)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mob-video">
      <div className="ex-video-frame" onClick={() => fileRef.current?.click()}>
        {video ? (
          <video src={video} autoPlay muted loop playsInline controls={false} />
        ) : (
          <div className="ex-video-empty">
            <Icon name="upload" size={22} />
            <span>{uploading ? 'Uploading…' : 'Tap to add a demo video'}</span>
          </div>
        )}
      </div>
      <button
        className="btn btn-ghost btn-sm replace-btn"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        <Icon name="upload" size={14} /> {video ? 'Replace video' : 'Upload video'}
      </button>
      {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{error}</div>}
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }}
      />
    </div>
  )
}
