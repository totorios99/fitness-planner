'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/Icon'

const DEFAULT_DAY_LABELS = ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B', 'Rest']

export default function NewRoutineButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'lifting' | 'mobility'>('lifting')
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
    if (type === 'lifting' && dayLabels.length < 2) {
      setError('Lifting routines need at least 2 days'); return
    }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
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

  function handleType(t: 'lifting' | 'mobility') {
    setType(t)
    // Lifting requires ≥2 days; bump up if the user had a 1-day mobility selection.
    if (t === 'lifting' && dayCount < 2) handleDayCount(2)
  }

  function handleClose() {
    setOpen(false)
    setName('')
    setDescription('')
    setType('lifting')
    setDayCount(3)
    setDayLabels(DEFAULT_DAY_LABELS.slice(0, 3))
    setError('')
  }

  return (
    <>
      <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={() => setOpen(true)}>
        <Icon name="plus" size={15} /> New routine
      </button>

      {open && (
        <div className="sheet-wrap" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
          <div className="sheet-modal">
            <div className="sheet-modal-head">
              <h3>New routine</h3>
              <button className="icon-btn" onClick={handleClose}><Icon name="x" size={18} /></button>
            </div>

            <div className="sheet-modal-body">
              <div className="field">
                <span>Name</span>
                <input
                  placeholder="e.g. Upper / Lower"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>

              <div className="field">
                <span>Description (optional)</span>
                <input
                  placeholder="e.g. 4-day split"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Type</span>
                <div className="segmented" style={{ width: 'fit-content' }}>
                  {(['lifting', 'mobility'] as const).map(t => (
                    <button
                      key={t}
                      className={`seg-btn${type === t ? ' active' : ''}`}
                      onClick={() => handleType(t)}
                      style={{ flex: 'none', minWidth: 80, textTransform: 'capitalize' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span>Days per week</span>
                <div className="segmented" style={{ width: 'fit-content' }}>
                  {(type === 'mobility' ? [1, 2, 3, 4, 5, 6] : [2, 3, 4, 5, 6]).map(n => (
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

              <div className="field">
                <span>Day names</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayLabels.map((label, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-4)', width: 48, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>Day {i + 1}</span>
                      <input
                        value={label}
                        onChange={e => setDayLabels(prev => prev.map((l, j) => j === i ? e.target.value : l))}
                        style={{ flex: 1, height: 42, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--bg)', color: 'var(--ink)', padding: '0 13px', fontSize: 15, outline: 'none' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>
              )}
            </div>

            <div className="sheet-modal-foot">
              <button className="btn btn-ghost" onClick={handleClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !name.trim()}>
                {saving ? 'Creating…' : 'Create routine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
