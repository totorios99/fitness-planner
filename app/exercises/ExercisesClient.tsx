'use client'

import { useState, useMemo } from 'react'
import { ExerciseCard } from '@/components/ExerciseCard'

const CATEGORIES = ['all', 'push', 'pull', 'legs', 'core']
const EQUIPMENT  = ['all', 'barbell', 'cable', 'machine', 'dumbbell', 'bodyweight', 'other']

interface Exercise {
  id: string; name: string; slug: string; category: string; equipment: string
  primaryMuscles: string; secondaryMuscles: string; imagePath: string | null
}

export default function ExercisesClient({ exercises }: { exercises: Exercise[] }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [eq, setEq] = useState('all')

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return exercises.filter(e =>
      (cat === 'all' || e.category === cat) &&
      (eq === 'all' || e.equipment === eq) &&
      (!ql || e.name.toLowerCase().includes(ql))
    )
  }, [exercises, q, cat, eq])

  return (
    <div className="page-inner">
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <input
          className="search-input"
          placeholder="Search exercises…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', pointerEvents: 'none' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
      </div>

      {/* Category filter */}
      <div className="filter-row">
        {CATEGORIES.map(c => (
          <button key={c} className={`filter-pill${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Equipment filter */}
      <div className="filter-row">
        {EQUIPMENT.map(e => (
          <button key={e} className={`filter-pill${eq === e ? ' active' : ''}`} onClick={() => setEq(e)}>
            {e === 'all' ? 'All Equipment' : e.charAt(0).toUpperCase() + e.slice(1)}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="t-caption">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''}</div>

      {/* Grid */}
      <div className="exercise-grid">
        {filtered.map(ex => (
          <ExerciseCard key={ex.id} {...ex} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <div className="t-headline" style={{ marginBottom: 8 }}>No exercises found</div>
          <p className="t-body">Try a different search or filter.</p>
        </div>
      )}
    </div>
  )
}
