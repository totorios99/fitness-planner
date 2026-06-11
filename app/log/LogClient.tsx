'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/Icon'

export default function LogClient() {
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(file: File) {
    if (!file.name.endsWith('.txt')) {
      setError('Must be a .txt file exported from Strong')
      return
    }
    setError('')
    setLoading(true)
    try {
      const text = await file.text()
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      router.push(`/log/${data.sessionId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import failed')
      setLoading(false)
    }
  }

  return (
    <div>
      <label
        className={`import-zone${drag ? ' drag' : ''}`}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault(); setDrag(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        onClick={() => !loading && inputRef.current?.click()}
        style={{ cursor: loading ? 'default' : 'pointer' }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>
          {loading ? '⏳' : <Icon name="upload" size={40} />}
        </div>
        <div className="t-headline">
          {loading ? 'Importing…' : 'Import Strong Export'}
        </div>
        <div className="t-body t-ink-3" style={{ marginTop: 8 }}>
          Tap or drag a .txt file shared from the Strong app
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </label>
      {error && (
        <div style={{ marginTop: 10, color: 'var(--danger)', fontSize: 14, textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  )
}
