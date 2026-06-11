export interface ChartPoint {
  label: string
  value: number
}

export function LineChart({
  data,
  color = 'var(--accent)',
  unit = '',
  height = 160,
  formatValue,
}: {
  data: ChartPoint[]
  color?: string
  unit?: string
  height?: number
  formatValue?: (v: number) => string
}) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-3)', fontSize: 14 }}>
        No data yet
      </div>
    )
  }
  if (data.length === 1) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-3)', fontSize: 14 }}>
        {data[0].label}: {formatValue ? formatValue(data[0].value) : data[0].value}{unit}
      </div>
    )
  }

  const W = 320
  const H = height
  const pad = { t: 12, r: 12, b: 28, l: 48 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b

  const vals = data.map(d => d.value)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const range = maxV === minV ? 1 : maxV - minV

  const px = (i: number) => pad.l + (i / (data.length - 1)) * iw
  const py = (v: number) => pad.t + ih - ((v - minV) / range) * ih

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.value)}`).join(' ')
  const area = `${line} L${px(data.length - 1)},${H - pad.b} L${pad.l},${H - pad.b} Z`

  const fmt = formatValue ?? ((v: number) => `${Math.round(v)}${unit}`)
  const yTicks = [minV, minV + range / 2, maxV]

  const xIndices = data.length <= 4
    ? data.map((_, i) => i)
    : [0, Math.floor((data.length - 1) / 2), data.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-label="chart">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} y1={py(v)} x2={W - pad.r} y2={py(v)} stroke="var(--line)" strokeWidth="1" />
          <text
            x={pad.l - 5} y={py(v)}
            textAnchor="end" dominantBaseline="middle"
            fontSize="10" fill="var(--ink-3)"
          >
            {fmt(v)}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#grad-${color.replace(/[^a-z]/gi, '')})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {data.map((d, i) => (
        <circle key={i} cx={px(i)} cy={py(d.value)} r="3.5" fill={color} />
      ))}

      {xIndices.map(i => (
        <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--ink-3)">
          {data[i].label}
        </text>
      ))}
    </svg>
  )
}
