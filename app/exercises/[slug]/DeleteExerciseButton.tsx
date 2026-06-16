'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/Icon'

export default function DeleteExerciseButton({ slug, name }: { slug: string; name: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  async function confirmDelete() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/exercises/${slug}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Delete failed')
      }
      router.push('/exercises')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
      setBusy(false)
    }
  }

  return (
    <>
      <button
        className="btn btn-ghost btn-sm replace-btn"
        style={{ color: 'var(--energy)' }}
        onClick={() => { setError(null); setOpen(true) }}
      >
        <Icon name="trash" size={16} /> Delete exercise
      </button>

      {open && mounted && createPortal((
        <div className="sheet-wrap" onClick={e => { if (e.target === e.currentTarget && !busy) setOpen(false) }}>
          <div className="sheet-modal">
            <div className="sheet-modal-head">
              <h3>Delete exercise?</h3>
              <button className="icon-btn" onClick={() => !busy && setOpen(false)}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="sheet-modal-body">
              <p className="t-body" style={{ color: 'var(--ink-2)' }}>
                Permanently delete <b>{name}</b> from the library. Past workout logs are kept but will
                no longer link to this exercise. This can’t be undone.
              </p>
              {error && (
                <div style={{
                  fontSize: 13, color: 'var(--energy)', background: 'var(--energy-soft)',
                  border: '1px solid var(--energy)', borderRadius: 'var(--r-md)', padding: '10px 12px',
                }}>
                  {error}
                </div>
              )}
            </div>
            <div className="sheet-modal-foot">
              <button className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-energy" onClick={confirmDelete} disabled={busy}>
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  )
}
