'use client'

import { useState } from 'react'
import { LineChart } from '@/components/LineChart'

interface ProgressPoint {
  label: string
  date: string
  maxWeight: number
  totalVolume: number
  totalSets: number
  totalReps: number
}

export default function ExerciseProgressWidget({ points, name }: { points: ProgressPoint[]; name: string }) {
  const [metric, setMetric] = useState<'maxWeight' | 'totalVolume'>('maxWeight')
  const [showAll, setShowAll] = useState(false)

  if (points.length === 0) {
    return (
      <div className="card card-body" style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 14, padding: '24px 16px' }}>
        No session data yet — import a workout to see progress.
      </div>
    )
  }

  const best = Math.max(...points.map(p => p.maxWeight))
  const vols = points.map(p => p.totalVolume)
  const volDiff = vols[vols.length - 1] - vols[0]
  const volPct = vols[0] > 0 ? Math.round((volDiff / vols[0]) * 100) : 0

  const displayed = showAll ? [...points].reverse() : [...points].reverse().slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Metric toggle */}
      <div className="segmented">
        <button
          className={`seg-btn${metric === 'maxWeight' ? ' active' : ''}`}
          onClick={() => setMetric('maxWeight')}
        >
          Max Weight
        </button>
        <button
          className={`seg-btn${metric === 'totalVolume' ? ' active' : ''}`}
          onClick={() => setMetric('totalVolume')}
        >
          Total Volume
        </button>
      </div>

      {/* Chart */}
      <div className="chart-wrap">
        <div className="chart-title">
          {name} — {metric === 'maxWeight' ? 'Max Weight (lb)' : 'Total Volume (lb)'}
        </div>
        <LineChart
          data={points.map(p => ({ label: p.label, value: metric === 'maxWeight' ? p.maxWeight : p.totalVolume }))}
          color={metric === 'maxWeight' ? 'var(--accent)' : 'var(--energy)'}
          unit=" lb"
          height={160}
        />
      </div>

      {/* Stats row */}
      <div className="card card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.1 }}>{best}</div>
            <div className="t-caption" style={{ marginTop: 3 }}>Best (lb)</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>{points.length}</div>
            <div className="t-caption" style={{ marginTop: 3 }}>Sessions</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--energy)', lineHeight: 1.1 }}>
              {volPct > 0 ? '+' : ''}{volPct}%
            </div>
            <div className="t-caption" style={{ marginTop: 3 }}>Vol. change</div>
          </div>
        </div>
      </div>

      {/* Session breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {displayed.map((p, i) => (
          <div key={i} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</div>
              <div className="t-caption">{p.totalSets} sets · {p.totalReps} reps</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.maxWeight} lb</div>
              <div className="t-caption">{Math.round(p.totalVolume).toLocaleString()} vol</div>
            </div>
          </div>
        ))}
        {points.length > 5 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAll(v => !v)}
          >
            {showAll ? 'Show less' : `Show all ${points.length} sessions`}
          </button>
        )}
      </div>
    </div>
  )
}
