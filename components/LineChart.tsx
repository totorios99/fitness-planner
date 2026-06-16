'use client'

import { useState } from 'react'

export interface ChartPoint {
  label: string
  value: number
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function LineChart({
  data,
  color = 'var(--accent)',
  unit = '',
  height = 150,
  formatValue,
}: {
  data: ChartPoint[]
  color?: string
  unit?: string
  height?: number
  formatValue?: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-3)', fontSize: 14 }}>
        No data yet
      </div>
    )
  }

  const W = 340
  const H = height
  const padL = 8, padR = 8, padT = 16, padB = 22
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const vals = data.map(d => d.value)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const span = maxV - minV || 1
  const lo = minV - span * 0.18
  const hi = maxV + span * 0.18
  const range = hi - lo

  const xOf = (i: number) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const yOf = (v: number) => padT + plotH - ((v - lo) / range) * plotH

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.value), ...d }))
  const line = smoothPath(pts)
  const area = line + ` L ${pts[pts.length - 1].x} ${padT + plotH} L ${pts[0].x} ${padT + plotH} Z`

  const gid = `g${Math.round(pts[0].x * 100)}`
  const fmt = formatValue ?? ((v: number) => `${Math.round(v)}${unit}`)

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width * W
    let idx = 0, dmin = Infinity
    pts.forEach((p, i) => {
      const dd = Math.abs(p.x - px)
      if (dd < dmin) { dmin = dd; idx = i }
    })
    setHover(idx)
  }

  const xLabels = data.length <= 4
    ? data.map((_, i) => i)
    : [0, Math.floor((data.length - 1) / 2), data.length - 1]

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
        preserveAspectRatio="none"
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}
        style={{ touchAction: 'none', display: 'block' }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baseline */}
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--line)" strokeWidth="1" />

        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {pts.map((p, i) => (
          <circle key={i}
            cx={p.x} cy={p.y}
            r={hover === i ? 4.5 : 2.5}
            fill={hover === i ? color : 'var(--bg-elev)'}
            stroke={color} strokeWidth="2"
            style={{ transition: 'r .1s' }}
          />
        ))}

        {/* last dot */}
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill={color} />

        {/* hover vertical line */}
        {hover !== null && (
          <line
            x1={pts[hover].x} y1={padT - 4}
            x2={pts[hover].x} y2={padT + plotH}
            stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="3 3"
          />
        )}
      </svg>

      {/* tooltip — anchor by zone so edge points don't overflow the card */}
      {hover !== null && (() => {
        const xPct = (pts[hover].x / W) * 100
        // left edge → anchor left; right edge → anchor right; else center
        const anchor = xPct < 16 ? 'left' : xPct > 84 ? 'right' : 'center'
        const transform =
          anchor === 'left' ? 'translateX(0)' :
          anchor === 'right' ? 'translateX(-100%)' :
          'translateX(-50%)'
        return (
          <div className="chart-tip" style={{ left: `${xPct}%`, transform }}>
            <b>{fmt(data[hover].value)}</b>
            <span>{data[hover].label}</span>
          </div>
        )
      })()}

      {/* x axis labels */}
      <div className="chart-x">
        {xLabels.map(i => (
          <span key={i}>{data[i].label}</span>
        ))}
      </div>
    </div>
  )
}
