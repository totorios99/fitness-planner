'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MUSCLES, muscleVar, muscleLabel } from '@/lib/muscles'
import { Icon } from '@/components/Icon'

const MUSCLE_KEYS = Object.keys(MUSCLES)

export default function EditMusclesButton({
  slug, primary, secondary,
}: {
  slug: string
  primary: string[]
  secondary: string[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pri, setPri] = useState<string[]>(primary)
  const [sec, setSec] = useState<string[]>(secondary)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  function reset() {
    setPri(primary)
    setSec(secondary)
    setError(null)
  }

  const togglePri = (m: string) =>
    setPri(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  // selecting a muscle as secondary removes it from primary and vice-versa is guarded in UI
  const toggleSec = (m: string) =>
    setSec(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  async function save() {
    if (pri.length === 0) { setError('Pick at least one primary muscle.'); return }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/exercises/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryMuscles: pri,
          // never let a muscle be both primary and secondary
          secondaryMuscles: sec.filter(m => !pri.includes(m)),
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        className="icon-btn"
        aria-label="Edit muscles"
        onClick={() => { reset(); setOpen(true) }}
      >
        <Icon name="filter" size={15} />
      </button>

      {open && mounted && createPortal((
        <div className="sheet-wrap" onClick={e => { if (e.target === e.currentTarget && !busy) setOpen(false) }}>
          <div className="sheet-modal">
            <div className="sheet-modal-head">
              <h3>Edit muscles</h3>
              <button className="icon-btn" onClick={() => !busy && setOpen(false)}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="sheet-modal-body">
              <div className="field">
                <span>Primary muscles</span>
                <div className="muscle-picker">
                  {MUSCLE_KEYS.map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`muscle-chip${pri.includes(m) ? ' active' : ''}`}
                      onClick={() => { togglePri(m); setSec(s => s.filter(x => x !== m)) }}
                    >
                      <span className="muscle-dot" style={{ background: `var(${muscleVar(m)})` }} />
                      {muscleLabel(m)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span>Secondary muscles</span>
                <div className="muscle-picker">
                  {MUSCLE_KEYS.map(m => {
                    const isPrimary = pri.includes(m)
                    return (
                      <button
                        key={m}
                        type="button"
                        className={`muscle-chip${sec.includes(m) ? ' active' : ''}`}
                        onClick={() => toggleSec(m)}
                        disabled={isPrimary}
                        style={isPrimary ? { opacity: 0.3, cursor: 'not-allowed' } : undefined}
                      >
                        <span className="muscle-dot" style={{ background: `var(${muscleVar(m)})` }} />
                        {muscleLabel(m)}
                      </button>
                    )
                  })}
                </div>
              </div>
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
              <button className="btn btn-primary" onClick={save} disabled={busy || pri.length === 0}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  )
}
