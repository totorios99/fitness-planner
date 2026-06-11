'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_DAY_LABELS = ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B', 'Rest']

export default function NewRoutineButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dayCount, setDayCount] = useState(3)
  const [dayLabels, setDayLabels] = useState(DEFAULT_DAY_LABELS.slice(0, 3))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleDayCount(n: number) {
    setDayCount(n)
    setDayLabels(prev => {
      const next = [...prev]
      while (next.length < n) next.push(DEFAULT_DAY_LABELS[next.length] ?? `Day ${next.length + 1}`)
      return next.slice(0, n)
    })
  }

  async function handleCreate() {
    if (!name.trim()) { setError('Name required'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          days: dayLabels.map(l => ({ label: l })),
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const routine = await res.json()
      router.push(`/routines/${routine.id}`)
    } catch {
      setError('Failed to create routine')
      setSaving(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setName('')
    setDescription('')
    setDayCount(3)
    setDayLabels(DEFAULT_DAY_LABELS.slice(0, 3))
    setError('')
  }

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        + New
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={handleClose}
        >
          <div
            style={{ background: 'var(--bg-elev)', width: '100%', maxWidth: 540, borderRadius: 'var(--r-xl) var(--r-xl) 0 0', padding: 20, maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>New Routine</div>

            <div className="form-row">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                placeholder="e.g. Upper / Lower"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-row">
              <label className="form-label">Description (optional)</label>
              <input
                className="form-input"
                placeholder="e.g. 4-day split"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row">
              <label className="form-label">Days per week</label>
              <div className="segmented" style={{ width: 'fit-content' }}>
                {[2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    className={`seg-btn${dayCount === n ? ' active' : ''}`}
                    onClick={() => handleDayCount(n)}
                    style={{ flex: 'none', minWidth: 44 }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">Day names</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dayLabels.map((label, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-3)', width: 48, flexShrink: 0 }}>Day {i + 1}</span>
                    <input
                      className="form-input"
                      value={label}
                      onChange={e => setDayLabels(prev => prev.map((l, j) => j === i ? e.target.value : l))}
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleClose}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating…' : 'Create Routine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
