'use client'

import { useState } from 'react'
import { LineChart } from '@/components/LineChart'

interface ProgressPoint {
  label: string
  date: string
  maxWeight: number
  bestReps: number
  totalVolume: number
  totalSets: number
  totalReps: number
}

const PAGE = 9

function Pager({
  page, total, onChange,
}: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  return (
    <div className="pager">
      <button
        className="pager-arrow"
        onClick={() => onChange(page + 1)}
        disabled={page >= total - 1}
        aria-label="Older"
      >
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div className="pager-dots">
        {Array.from({ length: total }, (_, d) => {
          const p = total - 1 - d
          return (
            <button
              key={p}
              className={`pager-dot${p === page ? ' active' : ''}`}
              onClick={() => onChange(p)}
              aria-label={`Page ${d + 1} of ${total}`}
            />
          )
        })}
      </div>
      <button
        className="pager-arrow"
        onClick={() => onChange(page - 1)}
        disabled={page <= 0}
        aria-label="Newer"
      >
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  )
}

export default function ExerciseProgressWidget({
  points,
  muscleColor = 'var(--accent)',
}: {
  points: ProgressPoint[]
  muscleColor?: string
}) {
  const [metric, setMetric] = useState<'maxWeight' | 'totalVolume'>('maxWeight')
  const [chartPage, setChartPage] = useState(0)
  const [tablePage, setTablePage] = useState(0)

  function changeMetric(m: 'maxWeight' | 'totalVolume') {
    setMetric(m)
    setChartPage(0)
  }

  if (points.length === 0) {
    return (
      <div className="chart-card" style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 14, padding: '32px 20px' }}>
        No session data yet — import a workout to see progress.
      </div>
    )
  }

  const bestPoint = points.reduce((b, p) =>
    p.maxWeight > b.maxWeight || (p.maxWeight === b.maxWeight && p.bestReps > b.bestReps) ? p : b
  )
  const currentPoint = points[points.length - 1]

  const firstVol = points[0].totalVolume
  const lastVol = currentPoint.totalVolume
  const volChange = firstVol > 0 ? Math.round(((lastVol - firstVol) / firstVol) * 100) : 0

  const chartPages = Math.ceil(points.length / PAGE)
  // One panel per page (page 0 = newest), laid out side-by-side for the carousel track.
  const chartPanels = Array.from({ length: chartPages }, (_, p) => {
    const end = points.length - p * PAGE
    return points.slice(Math.max(0, end - PAGE), end)
  })

  const reversed   = [...points].reverse()
  const tablePages = Math.ceil(reversed.length / PAGE)
  const tableSlice = reversed.slice(tablePage * PAGE, (tablePage + 1) * PAGE)

  const chartColor = metric === 'maxWeight' ? 'var(--energy)' : 'var(--accent-2)'
  const chartUnit  = metric === 'maxWeight' ? 'lb' : 'weight × reps × sets'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Stat tiles */}
      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="st-label">Best set</span>
          <span className="st-val num">
            {bestPoint.maxWeight.toLocaleString('en-US')} lb<small>× {bestPoint.bestReps}</small>
          </span>
        </div>
        <div className="stat-tile">
          <span className="st-label">Current top</span>
          <span className="st-val num">
            {currentPoint.maxWeight.toLocaleString('en-US')} lb<small>× {currentPoint.bestReps}</small>
          </span>
        </div>
        <div className="stat-tile">
          <span className="st-label">Volume Δ</span>
          <span className="st-val num" style={{ color: volChange >= 0 ? 'var(--accent)' : 'var(--energy)' }}>
            {volChange >= 0 ? '+' : ''}{volChange}%
          </span>
        </div>
      </div>

      {/* Progress chart */}
      <div className="chart-card chart-card-lg">
        <div className="chart-card-head">
          <div>
            <span className="chart-title">Progress</span>
            <span className="chart-unit"> &nbsp;{chartUnit}</span>
          </div>
          <div className="seg" role="tablist">
            <button
              className={`seg-btn${metric === 'maxWeight' ? ' active' : ''}`}
              onClick={() => changeMetric('maxWeight')}
            >
              Max weight
            </button>
            <button
              className={`seg-btn${metric === 'totalVolume' ? ' active' : ''}`}
              onClick={() => changeMetric('totalVolume')}
            >
              Volume
            </button>
          </div>
        </div>
        <div className="chart-carousel">
          <div className="chart-track" style={{ transform: `translateX(-${chartPage * 100}%)` }}>
            {chartPanels.map((slice, p) => (
              <div className="chart-panel" key={p}>
                <LineChart
                  data={slice.map(pt => ({
                    label: pt.label,
                    value: metric === 'maxWeight' ? pt.maxWeight : pt.totalVolume,
                  }))}
                  color={chartColor}
                  height={208}
                  formatValue={metric === 'maxWeight'
                    ? (v) => `${v.toLocaleString('en-US')} lb`
                    : (v) => `${(v / 1000).toFixed(1)}k`
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <Pager page={chartPage} total={chartPages} onChange={setChartPage} />
      </div>

      {/* Session history */}
      <div className="chart-card">
        <div className="chart-card-head">
          <span className="chart-title">Session history</span>
          <span className="chart-unit">{points.length} total</span>
        </div>
        <div className="hist-table">
          <div className="hist-row hist-head">
            <span>Date</span>
            <span>Top set</span>
            <span className="ta-r">Sets</span>
            <span className="ta-r">Volume</span>
          </div>
          {tableSlice.map((p, i) => (
            <div key={i} className="hist-row">
              <span className="hist-date">{p.label}</span>
              <span className="hist-top num">{p.maxWeight.toLocaleString('en-US')} × {p.bestReps}</span>
              <span className="hist-sets">{p.totalSets}</span>
              <span className="hist-vol num">{(p.totalVolume / 1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>
        <Pager page={tablePage} total={tablePages} onChange={setTablePage} />
      </div>

    </div>
  )
}
