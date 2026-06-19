'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseMuscles, muscleVar, muscleLabel, MUSCLES } from '@/lib/muscles'
import { Icon } from '@/components/Icon'

const CATEGORIES = ['all', 'push', 'pull', 'legs', 'core']
const EQUIPMENT  = ['all', 'barbell', 'cable', 'machine', 'dumbbell', 'bodyweight', 'other']
const MUSCLE_KEYS = Object.keys(MUSCLES)
const MOBILITY_GROUPS = ['core', 'legs', 'back', 'shoulders', 'general']

const CAT_MUSCLES: Record<string, string[]> = {
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'lats', 'biceps'],
  legs: ['quads', 'hamstrings', 'glutes'],
  core: ['core'],
}

interface Exercise {
  id: string; name: string; slug: string; category: string; equipment: string
  primaryMuscles: string; secondaryMuscles: string; imagePath: string | null
  lastWeight: number | null; sparkPoints: number[]
}

function MiniSpark({ points, color }: { points: number[]; color: string }) {
  if (points.length < 1) return null
  const W = 64, H = 24
  const pad = 2
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  // single point → flat midline so a chart still renders
  const xs = points.length === 1
    ? [pad, W - pad]
    : points.map((_, i) => pad + (i / (points.length - 1)) * (W - pad * 2))
  const ysVals = points.length === 1 ? [points[0], points[0]] : points
  const ys = ysVals.map(v => H - pad - ((v - min) / range) * (H - pad * 2))
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2.5" fill={color} />
    </svg>
  )
}

export default function ExercisesClient({ exercises }: { exercises: Exercise[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [eq, setEq] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'lifting' | 'mobility'>('lifting')
  const [newCat, setNewCat] = useState('push')
  const [newGroup, setNewGroup] = useState('general')
  const [newEq, setNewEq] = useState('barbell')
  const [newPrimary, setNewPrimary] = useState<string[]>([])
  const [newSecondary, setNewSecondary] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const togglePrimary = (m: string) =>
    setNewPrimary(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  const toggleSecondary = (m: string) =>
    setNewSecondary(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return exercises.filter(e =>
      (cat === 'all' || e.category === cat) &&
      (eq === 'all' || e.equipment === eq) &&
      (!ql || e.name.toLowerCase().includes(ql))
    )
  }, [exercises, q, cat, eq])

  const createExercise = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      // Mobility movements carry only a group (stored in category) — no muscles/equipment.
      const payload = newType === 'mobility'
        ? { name: newName.trim(), type: 'mobility', category: newGroup, equipment: 'other', primaryMuscles: [], secondaryMuscles: [] }
        : { name: newName.trim(), type: 'lifting', category: newCat, equipment: newEq, primaryMuscles: newPrimary, secondaryMuscles: newSecondary }
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/exercises/${data.slug}`)
    } catch {
      setCreating(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="board-eyebrow">{exercises.length} movements</div>
          <h1 className="board-title">Exercise <em>library</em></h1>
        </div>
        <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={() => setShowNew(true)}>
          <Icon name="plus" size={15} /> New exercise
        </button>
      </div>

      {/* Search */}
      <div className="ex-toolbar">
        <div className="search">
          <svg className="search-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search exercises…" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        {/* Category filter */}
        <div className="filter-chips">
          {CATEGORIES.map(c => {
            const muscles = CAT_MUSCLES[c]
            return (
              <button key={c} className={`fchip${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>
                {muscles && (
                  <span className="muscle-dot" style={{ background: `var(${muscleVar(muscles[0])})` }} />
                )}
                {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            )
          })}
        </div>

        {/* Equipment filter */}
        <div className="filter-chips">
          {EQUIPMENT.map(e => (
            <button key={e} className={`fchip${eq === e ? ' active' : ''}`} onClick={() => setEq(e)}>
              {e === 'all' ? 'All Equipment' : e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="ex-list">
        {filtered.map(ex => {
          const primary = parseMuscles(ex.primaryMuscles)
          const topMuscle = primary[0] ?? 'core'
          const cssVar = muscleVar(topMuscle)
          return (
            <Link key={ex.id} href={`/exercises/${ex.slug}`} className="ex-row" style={{ textDecoration: 'none' }}>
              <div className="ex-row-bar" style={{ background: `var(${cssVar})` }} />
              <div className="ex-row-main">
                <div className="ex-row-name">{ex.name}</div>
                <div className="ex-row-meta">
                  {primary[0] && (
                    <span className="m-pill" style={{ background: `var(${cssVar})` }}>
                      {muscleLabel(primary[0])}
                    </span>
                  )}
                  <span className="ex-row-equip">{ex.equipment}</span>
                </div>
              </div>
              <div className="ex-row-spark">
                {ex.sparkPoints.length >= 1 && (
                  <MiniSpark points={ex.sparkPoints} color={`var(${cssVar})`} />
                )}
                {ex.lastWeight != null && (
                  <span className="ex-row-last">{ex.lastWeight} lb</span>
                )}
              </div>
              <div className="ex-row-chev">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <div className="t-headline" style={{ marginBottom: 8 }}>No exercises found</div>
          <p className="t-body">Try a different search or filter.</p>
        </div>
      )}

      {/* New exercise modal */}
      {showNew && (
        <div className="sheet-wrap" onClick={e => { if (e.target === e.currentTarget) setShowNew(false) }}>
          <div className="sheet-modal">
            <div className="sheet-modal-head">
              <h3>New exercise</h3>
              <button className="icon-btn" onClick={() => setShowNew(false)}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="sheet-modal-body">
              <div className="field">
                <span>Name</span>
                <input
                  placeholder="e.g. Incline Dumbbell Press"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createExercise()}
                  autoFocus
                />
              </div>
              <div className="field">
                <span>Type</span>
                <div className="segmented" style={{ width: 'fit-content' }}>
                  {(['lifting', 'mobility'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`seg-btn${newType === t ? ' active' : ''}`}
                      onClick={() => setNewType(t)}
                      style={{ flex: 'none', minWidth: 80, textTransform: 'capitalize' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {newType === 'mobility' ? (
                <div className="field">
                  <span>Group</span>
                  <select value={newGroup} onChange={e => setNewGroup(e.target.value)}>
                    {MOBILITY_GROUPS.map(g => (
                      <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="field">
                    <span>Category</span>
                    <select value={newCat} onChange={e => setNewCat(e.target.value)}>
                      {['push','pull','legs','core','other'].map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <span>Equipment</span>
                    <select value={newEq} onChange={e => setNewEq(e.target.value)}>
                      {['barbell','dumbbell','cable','machine','bodyweight','other'].map(e => (
                        <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <span>Primary muscles</span>
                    <div className="muscle-picker">
                      {MUSCLE_KEYS.map(m => (
                        <button
                          key={m}
                          type="button"
                          className={`muscle-chip${newPrimary.includes(m) ? ' active' : ''}`}
                          onClick={() => togglePrimary(m)}
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
                        const isPrimary = newPrimary.includes(m)
                        return (
                          <button
                            key={m}
                            type="button"
                            className={`muscle-chip${newSecondary.includes(m) ? ' active' : ''}`}
                            onClick={() => toggleSecondary(m)}
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
                </>
              )}
            </div>
            <div className="sheet-modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createExercise} disabled={creating || !newName.trim()}>
                {creating ? 'Creating…' : 'Create exercise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
