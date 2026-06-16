'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { LineChart } from '@/components/LineChart'

interface ExerciseMeta { id: string; name: string; slug: string; category: string }
interface ProgressPoint {
  label: string; date: string
  maxWeight: number; totalVolume: number; totalSets: number; totalReps: number
}

export default function ProgressClient({ exercises }: { exercises: ExerciseMeta[] }) {
  const searchParams = useSearchParams()
  const initialSlug = searchParams.get('exercise') ?? exercises[0]?.slug ?? ''
  const [slug, setSlug] = useState(initialSlug)
  const [points, setPoints] = useState<ProgressPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [metric, setMetric] = useState<'maxWeight' | 'totalVolume'>('maxWeight')

  const load = useCallback(async (s: string) => {
    if (!s) return
    setLoading(true)
    try {
      const res = await fetch(`/api/progress/${s}`)
      const data = await res.json()
      setPoints(data.points ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(slug) }, [slug, load])

  const selected = exercises.find(e => e.slug === slug)

  return (
    <div className="page-inner">
      {/* Exercise selector */}
      <div className="form-row">
        <label className="form-label">Exercise</label>
        <select
          className="form-select"
          value={slug}
          onChange={e => setSlug(e.target.value)}
        >
          {exercises.map(ex => (
            <option key={ex.slug} value={ex.slug}>{ex.name}</option>
          ))}
        </select>
      </div>

      {/* Metric toggle */}
      <div className="segmented">
        <button className={`seg-btn${metric === 'maxWeight' ? ' active' : ''}`} onClick={() => setMetric('maxWeight')}>
          Max Weight
        </button>
        <button className={`seg-btn${metric === 'totalVolume' ? ' active' : ''}`} onClick={() => setMetric('totalVolume')}>
          Total Volume
        </button>
      </div>

      {/* Chart */}
      <div className="chart-wrap">
        <div className="chart-title">
          {selected?.name} — {metric === 'maxWeight' ? 'Max Weight (lb)' : 'Total Volume (lb)'}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-3)', fontSize: 14 }}>
            Loading…
          </div>
        ) : (
          <LineChart
            data={points.map(p => ({ label: p.label, value: metric === 'maxWeight' ? p.maxWeight : p.totalVolume }))}
            color={metric === 'maxWeight' ? 'var(--accent)' : 'var(--energy)'}
            unit=" lb"
            height={180}
          />
        )}
      </div>

      {/* Stats summary */}
      {points.length > 0 && (
        <div className="card card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                {Math.max(...points.map(p => p.maxWeight))}
              </div>
              <div className="t-caption">Best set (lb)</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--energy)' }}>
                {points.length}
              </div>
              <div className="t-caption">Sessions</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {(() => {
                  const vols = points.map(p => p.totalVolume)
                  const diff = vols[vols.length - 1] - vols[0]
                  const pct = vols[0] > 0 ? Math.round((diff / vols[0]) * 100) : 0
                  return `${pct > 0 ? '+' : ''}${pct}%`
                })()}
              </div>
              <div className="t-caption">Vol. change</div>
            </div>
          </div>
        </div>
      )}

      {/* Per-session breakdown */}
      {points.length > 0 && (
        <div>
          <div className="section-head"><span className="section-label">Session Breakdown</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...points].reverse().map((p, i) => (
              <div key={i} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.label}</div>
                  <div className="t-caption">{p.totalSets} sets · {p.totalReps} reps</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.maxWeight} lb</div>
                  <div className="t-caption">{Math.round(p.totalVolume).toLocaleString('en-US')} vol</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {points.length === 0 && !loading && (
        <div className="empty-state">
          <div className="icon">📈</div>
          <div className="t-headline" style={{ marginBottom: 8 }}>No data yet</div>
          <p className="t-body">Import workouts in the Log tab to start tracking progress.</p>
        </div>
      )}
    </div>
  )
}
